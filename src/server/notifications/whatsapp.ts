import "server-only";
import { getServerEnv } from "@/server/env";
import { WELCOME_WHATSAPP_TEMPLATES, isPendingWhatsAppTemplate, renderWhatsAppTemplate } from "./whatsappTemplates";
import { normalizePhoneToE164 } from "./phone";

// Bump when Meta deprecates this version — nothing else here changes.
const GRAPH_API_VERSION = "v21.0";

/**
 * Meta's own WhatsApp Cloud API directly — no Twilio or other
 * intermediary (2026-08-25, Cristian's own choice: he's comfortable
 * doing Meta's business verification himself, and this avoids Twilio's
 * per-message markup on top of Meta's own conversation pricing). Same
 * fire-and-forget contract as sendWelcomeEmail() — called from
 * src/app/api/lead/route.ts, must never turn a successfully-saved lead
 * into an error response. Every early return is a deliberate no-op
 * (unconfigured Meta credentials, still-placeholder template,
 * unparseable phone), never a thrown error.
 *
 * Request shape confirmed against Meta's own docs, not guessed:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/
 * POST https://graph.facebook.com/{version}/{phone-number-id}/messages,
 * Bearer token auth, `to` in E.164 with the leading `+`.
 *
 * One real limitation to know about ahead of time: outside of Meta's
 * own testing tools, sending a message the recipient didn't ask for in
 * that moment (like this welcome message) requires an **approved
 * message template**, not free-form `text` like this call uses — see
 * docs/AUTOMATIONS.md. Until a template is approved, this call will
 * come back from Meta as an error (logged, never thrown) for any
 * recipient outside your own test numbers.
 */
export async function sendWelcomeWhatsApp(input: { name: string; phone: string; topic: string }): Promise<void> {
  const { META_WHATSAPP_ACCESS_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID } = getServerEnv();
  if (!META_WHATSAPP_ACCESS_TOKEN || !META_WHATSAPP_PHONE_NUMBER_ID) {
    console.warn(
      "[notifications] META_WHATSAPP_ACCESS_TOKEN/META_WHATSAPP_PHONE_NUMBER_ID not configured — skipping welcome WhatsApp.",
    );
    return;
  }

  const template = WELCOME_WHATSAPP_TEMPLATES[input.topic] ?? WELCOME_WHATSAPP_TEMPLATES.general;
  if (isPendingWhatsAppTemplate(template)) {
    console.warn(
      `[notifications] Welcome WhatsApp for topic "${input.topic}" is still a placeholder — skipping, not sending unwritten copy.`,
    );
    return;
  }

  const toNumber = normalizePhoneToE164(input.phone);
  if (!toNumber) {
    console.warn(`[notifications] Could not normalize phone "${input.phone}" to E.164 — skipping welcome WhatsApp.`);
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${META_WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toNumber,
          type: "text",
          text: { body: renderWhatsAppTemplate(template, { name: input.name }) },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[notifications] Meta WhatsApp API responded ${response.status}: ${errorBody}`);
    }
  } catch (err) {
    // Never rethrow — see this function's own doc comment.
    console.error("[notifications] Failed to send welcome WhatsApp", err);
  }
}
