import "server-only";

/**
 * One welcome-email template per ContactForm topic
 * (src/components/forms/ContactForm.tsx's `topics`, same 8 values
 * src/app/api/lead/route.ts's `leadSchema` already validates) — the
 * text is Cristian's own words, not invented here (this project's own
 * rule: no fabricated commercial copy, docs/ARCHITECTURE.md §11).
 *
 * Every `body` below is a placeholder, on purpose: `isPendingTemplate()`
 * refuses to let `sendWelcomeEmail()` (src/server/notifications/email.ts)
 * actually send one of these to a real person. Replace the placeholder
 * text for a topic — nothing else needs to change — and that topic's
 * welcome email goes live the next time someone registers with it.
 * `{name}` is the only substitution available; keep it if you want the
 * email to open with the person's name.
 */

const PENDING_MARKER = "[PENDIENTE";

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const WELCOME_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  entrenar: {
    subject: "[PENDIENTE] Asunto — Entrenamiento",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Entrenamiento. Usa {name} donde quieras el nombre de la persona.]",
  },
  coaching: {
    subject: "[PENDIENTE] Asunto — Coaching personalizado",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Coaching personalizado. Usa {name} donde quieras el nombre de la persona.]",
  },
  shows: {
    subject: "[PENDIENTE] Asunto — Shows",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Shows. Usa {name} donde quieras el nombre de la persona.]",
  },
  marcas: {
    subject: "[PENDIENTE] Asunto — Marcas y partnerships",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Marcas y partnerships. Usa {name} donde quieras el nombre de la persona.]",
  },
  musica: {
    subject: "[PENDIENTE] Asunto — Música",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Música. Usa {name} donde quieras el nombre de la persona.]",
  },
  productos_fisicos: {
    subject: "[PENDIENTE] Asunto — Productos físicos",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Productos físicos. Usa {name} donde quieras el nombre de la persona.]",
  },
  productos_digitales: {
    subject: "[PENDIENTE] Asunto — Productos digitales",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida para alguien interesado en Productos digitales. Usa {name} donde quieras el nombre de la persona.]",
  },
  general: {
    subject: "[PENDIENTE] Asunto — General",
    body: "[PENDIENTE — Cristian escribe aquí el correo de bienvenida genérico, para quien marcó 'Otro'. Usa {name} donde quieras el nombre de la persona.]",
  },
};

/** True until Cristian replaces the placeholder text for this topic. */
export function isPendingTemplate(template: EmailTemplate): boolean {
  return template.subject.includes(PENDING_MARKER) || template.body.includes(PENDING_MARKER);
}

export function renderTemplate(template: EmailTemplate, vars: { name: string }): EmailTemplate {
  const fill = (text: string) => text.replaceAll("{name}", vars.name);
  return { subject: fill(template.subject), body: fill(template.body) };
}
