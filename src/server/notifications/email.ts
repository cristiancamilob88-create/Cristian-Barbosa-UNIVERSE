import "server-only";
import nodemailer from "nodemailer";
import { getServerEnv } from "@/server/env";
import { WELCOME_EMAIL_TEMPLATES, isPendingTemplate, renderTemplate } from "./emailTemplates";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * Gmail SMTP, not a transactional-email vendor (Resend/SendGrid/etc.) —
 * Cristian's own request, 2026-08-25: those need a verified custom
 * domain before they'll send to anyone but the account owner (confirmed
 * against Resend's own docs), and buying a domain wasn't something he
 * wanted to block on. Gmail SMTP sends to real recipients today, with
 * only a Google "App Password" — no domain purchase, no new vendor
 * account beyond the Gmail address Cristian already has. Trade-off,
 * stated plainly: ~500 messages/day cap (Gmail personal), and it reads
 * as "from Cristian's Gmail," not a branded address — acceptable for
 * this volume; revisit (Resend, once a domain exists) if that changes.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = getServerEnv();
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      // App Passwords are usually shown as "abcd efgh ijkl mnop" —
      // spaces are just for readability, Google's own auth doesn't want them.
      pass: GMAIL_APP_PASSWORD.replaceAll(" ", ""),
    },
  });
  return cachedTransporter;
}

/**
 * Fire-and-forget from the caller's perspective — see
 * src/app/api/lead/route.ts's call site: a failed/skipped email must
 * never turn a successfully-saved lead into a 500 for the visitor.
 * Every early return here is a deliberate no-op, not a thrown error:
 * unconfigured Gmail credentials (feature not set up yet) and a still-
 * placeholder template (Cristian hasn't written that topic's copy yet)
 * are both "nothing to send," not failures.
 */
export async function sendWelcomeEmail(input: { name: string; email: string; topic: string }): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[notifications] GMAIL_USER/GMAIL_APP_PASSWORD not configured — skipping welcome email.");
    return;
  }

  const template = WELCOME_EMAIL_TEMPLATES[input.topic] ?? WELCOME_EMAIL_TEMPLATES.general;
  if (isPendingTemplate(template)) {
    console.warn(
      `[notifications] Welcome email for topic "${input.topic}" is still a placeholder — skipping, not sending unwritten copy.`,
    );
    return;
  }

  const { subject, body } = renderTemplate(template, { name: input.name });
  const { GMAIL_USER } = getServerEnv();

  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: input.email,
      subject,
      text: body,
    });
  } catch (err) {
    // Never rethrow — see this function's own doc comment.
    console.error("[notifications] Failed to send welcome email", err);
  }
}
