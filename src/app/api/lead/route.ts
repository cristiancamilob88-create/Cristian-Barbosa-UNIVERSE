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
import { recordInteraction } from "@/server/db/repositories/interaction";

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
  topic: z.enum([
    "entrenar",
    "coaching",
    "shows",
    "marcas",
    "musica",
    "productos_fisicos",
    "productos_digitales",
    "general",
  ]),
  message: z.string().trim().max(2000).optional().default(""),
  // Honeypot: real users never fill this hidden field. Bounded but NOT
  // max(0) — a filled value must reach the `if (parsed.data.company)`
  // check below to be silently dropped; rejecting it at the schema level
  // with a 400 would tell a bot exactly which field to leave empty.
  company: z.string().max(200).optional().default(""),
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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
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

  const { name, email, topic, message } = parsed.data;

  try {
    const { visitorId, isNewVisitorId } = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);

      const { contact, created } = await findOrCreateContact(
        client,
        { email, phone: null, name },
        visitorCtx.visitor,
      );
      await linkVisitorToContact(client, visitorCtx.visitorId, contact.id);

      if (created) {
        await recordInteraction(client, {
          visitorId: visitorCtx.visitorId,
          contactId: contact.id,
          eventName: "contact_created",
          route: "/contacto",
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

      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: contact.id,
        eventName: "lead_submitted",
        route: "/contacto",
        touch: visitorCtx.touch,
        metadata: { topic, leadId: lead.id },
      });

      return {
        visitorId: visitorCtx.visitorId,
        isNewVisitorId: visitorCtx.isNewVisitorId,
      };
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
