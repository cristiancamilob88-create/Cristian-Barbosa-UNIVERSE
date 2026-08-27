import "server-only";
import twilio from "twilio";
import { getServerEnv } from "@/server/env";
import { WELCOME_WHATSAPP_TEMPLATES, isPendingWhatsAppTemplate, renderWhatsAppTemplate } from "./whatsappTemplates";
import { normalizePhoneToE164 } from "./phone";

let cachedClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = getServerEnv();
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  cachedClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return cachedClient;
}

/**
 * Same fire-and-forget contract as sendWelcomeEmail() (src/server/notifications/email.ts)
 * — called from src/app/api/lead/route.ts, must never turn a
 * successfully-saved lead into an error response. Every early return is
 * a deliberate no-op (unconfigured Twilio, still-placeholder template,
 * unparseable phone), never a thrown error.
 *
 * Works against Twilio's WhatsApp Sandbox today (free, instant, no
 * Meta business verification — join code from the Twilio console,
 * TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"), and against a real
 * approved WhatsApp sender later with zero code change — just a
 * different TWILIO_WHATSAPP_FROM. One real difference to know about
 * ahead of time: outside the Sandbox, WhatsApp requires an
 * **approved message template** for a business-initiated conversation
 * like this one (a welcome message the person didn't ask for in that
 * moment) — free-form `body` text like this only works in the Sandbox,
 * or as a reply within 24h of the person messaging first. Revisit this
 * function's `client.messages.create` call once a template is approved
 * (see docs/AUTOMATIONS.md).
 */
export async function sendWelcomeWhatsApp(input: { name: string; phone: string; topic: string }): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[notifications] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not configured — skipping welcome WhatsApp.");
    return;
  }

  const { TWILIO_WHATSAPP_FROM } = getServerEnv();
  if (!TWILIO_WHATSAPP_FROM) {
    console.warn("[notifications] TWILIO_WHATSAPP_FROM not configured — skipping welcome WhatsApp.");
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
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${toNumber}`,
      body: renderWhatsAppTemplate(template, { name: input.name }),
    });
  } catch (err) {
    console.error("[notifications] Failed to send welcome WhatsApp", err);
  }
}
