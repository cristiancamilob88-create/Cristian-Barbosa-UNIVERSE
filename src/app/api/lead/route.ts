import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { withTransaction } from "@/server/db/transaction";
import { resolveVisitorContext } from "@/server/db/visitorContext";
import { resolveInterestId } from "@/server/db/repositories/reference";
import { findOrCreateContact, assignInterest } from "@/server/db/repositories/contact";
import { linkVisitorToContact } from "@/server/db/repositories/visitor";
import { createLead } from "@/server/db/repositories/lead";
import { createB2bOpportunity, type B2bCategory } from "@/server/db/repositories/b2bOpportunity";
import {
  PLAN_DICIEMBRE_PRODUCT_SLUG,
  getProductIdBySlug,
  upsertPendingEnrollment,
} from "@/server/db/repositories/training";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { createRateLimiter, getRequestIp } from "@/server/rateLimit";
import { privacyPolicyVersion } from "@/config/legal";
import { eventAddressSchema } from "@/lib/eventAddress";
import { runAfterResponse } from "@/server/afterResponse";
import { sendWelcomeEmail } from "@/server/notifications/email";
import { sendWelcomeWhatsApp } from "@/server/notifications/whatsapp";

/**
 * Lead intake endpoint for the /contacto form. Persists the full flow
 * documented in docs/CRM.md:
 *
 * validate -> resolve attribution -> find-or-create contact -> preserve
 * first touch / update last touch -> assign interest if resolvable ->
 * create lead -> record `contact_created` (only when a new contact was
 * actually created — see docs/ANALYTICS_ENGINE.md) and `lead_submitted`
 * interactions -> respond.
 *
 * Security: all input is validated with zod before touching application
 * logic; a honeypot field and an in-memory sliding-window rate limit
 * guard the endpoint (documented limitation: in-memory state doesn't
 * survive a redeploy or coordinate across instances — see docs/SECURITY.md).
 * No database credential or row is ever returned to the client.
 */

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  // Required — WhatsApp is this site's real follow-up channel
  // throughout (community, comercial, subscriptions); a lead with no
  // number is one the team can't actually reach the way most people
  // expect. Same shape as the client-side check (ContactForm.tsx) —
  // this is the real enforcement point, that one is just UX.
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[0-9+()\s-]+$/),
  topic: z.enum([
    "entrenar",
    "coaching",
    "shows",
    "marcas",
    "musica",
    "productos_fisicos",
    "productos_digitales",
    "plan_diciembre",
    "general",
  ]),
  message: z.string().trim().max(2000).optional().default(""),
  // Honeypot: real users never fill this hidden field. Bounded but NOT
  // max(0) — a filled value must reach the `if (parsed.data.company)`
  // check below to be silently dropped; rejecting it at the schema level
  // with a 400 would tell a bot exactly which field to leave empty.
  company: z.string().max(200).optional().default(""),
  // Mandatory data-processing authorization (Ley 1581 de 2012) — the
  // checkbox in ContactForm. Enforced here, not just in the browser: a
  // lead without it is rejected, never stored.
  consent: z.literal(true),
  // Where the event is — only sent for "shows" (AddressAutocomplete),
  // validated by the same schema the browser uses.
  eventAddress: eventAddressSchema.optional(),
  // Plan Diciembre sign-up only (/entrenar/plan-diciembre): where they'd
  // train and what they want out of it — copied onto the pending
  // training_enrollment row, ignored for every other topic.
  trainingZone: z.string().trim().max(80).optional(),
  trainingGoal: z.string().trim().max(300).optional(),
  trainingObjective: z.enum(["bajar_peso", "fuerza", "tonificar", "skills", "general"]).optional(),
});

/**
 * Maps the contact form's topic values to the canonical interest
 * dictionary (supabase seed.sql). productos_fisicos/productos_digitales
 * (Block 07, docs/MASTER_BRIEF_BLOCK_07_10.md §07.11) replace the old
 * generic "productos" topic — `physical_products`/`digital_products`
 * existed in the interest dictionary since Block 02 but had no topic
 * that ever resolved to them until now.
 */
const TOPIC_TO_INTEREST_SLUG: Record<string, string | undefined> = {
  entrenar: "training",
  coaching: "coaching",
  shows: "shows",
  marcas: "brands",
  musica: "music",
  productos_fisicos: "physical_products",
  productos_digitales: "digital_products",
  plan_diciembre: "coaching",
  // "general" intentionally maps to no specific interest.
};

/**
 * shows/marcas are the B2B topics (docs/MASTER_BRIEF_BLOCK_07_10.md,
 * "Block 07"): alongside the generic `lead` row every topic gets, these
 * two also open a `b2b_opportunity` row so the shows/brands pipeline
 * (`stage`) is real instead of just another contact-form submission.
 */
const TOPIC_TO_B2B_CATEGORY: Record<string, B2bCategory | undefined> = {
  shows: "shows",
  marcas: "brands",
};

// 30/min per IP, not 5 — raised 2026-09-05 for the Concordia event: many
// real attendees submitting the form from the same venue wifi / carrier
// NAT would otherwise share one IP and trip a low per-IP cap, turning
// real leads into false 429s at exactly the moment this endpoint matters
// most. Still low enough to stop a scripted flood.
const leadRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  if (leadRateLimiter.isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.company) {
    // Honeypot tripped — pretend success, drop silently, no DB write.
    return NextResponse.json({ ok: true });
  }

  const { name, email, phone, topic, message } = parsed.data;
  // Where the form lives — /contacto for every topic except the Plan
  // Diciembre sign-up, which has its own landing (docs/TRAINING.md).
  const formRoute = topic === "plan_diciembre" ? "/entrenar/plan-diciembre" : "/contacto";
  // Only a shows request carries an event location; ignore it otherwise.
  const eventAddress = topic === "shows" ? parsed.data.eventAddress : undefined;

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);

      const { contact, created } = await findOrCreateContact(
        client,
        { email, phone, name, consentVersion: privacyPolicyVersion },
        visitorCtx.visitor,
      );
      await linkVisitorToContact(client, visitorCtx.visitorId, contact.id);

      if (created) {
        await recordInteraction(client, {
          visitorId: visitorCtx.visitorId,
          contactId: contact.id,
          eventName: "contact_created",
          route: formRoute,
          touch: visitorCtx.touch,
        });
      }

      const interestSlug = TOPIC_TO_INTEREST_SLUG[topic];
      const interestId = await resolveInterestId(client, interestSlug ?? null);
      if (interestId) {
        await assignInterest(client, contact.id, interestId);
      }

      const lead = await createLead(client, {
        contactId: contact.id,
        interestId,
        topicRaw: topic,
        message: message || null,
        eventAddress: eventAddress ?? null,
        touch: visitorCtx.touch,
      });

      const b2bCategory = TOPIC_TO_B2B_CATEGORY[topic];
      if (b2bCategory) {
        await createB2bOpportunity(client, {
          contactId: contact.id,
          category: b2bCategory,
          notes: message || null,
          touch: visitorCtx.touch,
        });
      }

      // Plan Diciembre (docs/TRAINING.md): alongside the lead, a pending
      // enrollment Cristian approves from /admin/alumnos — same "topic
      // opens its own pipeline row" pattern as b2b_opportunity above.
      if (topic === "plan_diciembre") {
        const productId = await getProductIdBySlug(client, PLAN_DICIEMBRE_PRODUCT_SLUG);
        if (productId) {
          await upsertPendingEnrollment(client, {
            contactId: contact.id,
            productId,
            goal: parsed.data.trainingGoal || null,
            objective: parsed.data.trainingObjective ?? null,
            zone: parsed.data.trainingZone || null,
          });
        }
      }

      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: contact.id,
        eventName: "lead_submitted",
        route: formRoute,
        touch: visitorCtx.touch,
        metadata: { topic, leadId: lead.id },
      });

      return {
        visitorId: visitorCtx.visitorId,
        isNewVisitorId: visitorCtx.isNewVisitorId,
      };
    });

    // Runs after the response is sent, via runAfterResponse() (Next's
    // after() under the hood) — NOT a bare `void fn()` fire-and-forget.
    // The lead is saved either way; see sendWelcomeEmail()'s/
    // sendWelcomeWhatsApp()'s own doc comments for why neither ever
    // throws back into this handler, and runAfterResponse()'s own doc
    // comment for the real bug a bare `void` call had here (2026-08-28).
    runAfterResponse(async () => {
      await Promise.all([
        sendWelcomeEmail({ name, email, topic }),
        sendWelcomeWhatsApp({ name, phone, topic }),
      ]);
    });

    const response = NextResponse.json({ ok: true });
    if (isNewVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions);
    }
    return response;
  } catch (err) {
    console.error("[lead] failed to persist", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos guardar tu mensaje. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
