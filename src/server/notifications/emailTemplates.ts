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

// Mismo dominio que whatsappTemplates.ts (producción vive en Vercel por
// ahora, sin dominio propio comprado todavía — 2026-08-28).
const SITE_URL = "https://cristian-barbosa-universe.vercel.app";
// Línea compartida al final de cada correo — no compite con el CTA
// principal del tema, es solo un extra (idea de Cristian, 2026-08-28).
const FOLLOW_LINE = `También puedes seguirme en todas mis redes aquí: ${SITE_URL}/redes`;

export const WELCOME_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  // Cada tema manda a la página del sitio que ya tiene el CTA correcto
  // integrado (WhatsApp comercial, Facebook de suscriptores, etc.) —
  // más simple de mantener que poner el link directo en cada correo, y
  // la persona ve contexto antes de dar el clic (decisión de Cristian,
  // 2026-08-28). Coaching es la única excepción: va directo al WhatsApp
  // personal/comercial de Cristian (mismo número, +57 302 634 2927 — no
  // se guarda el número en el repo, el link `/go/whatsapp-commercial`
  // ya lo tiene codificado) porque ahí sí se busca cerrar la venta
  // directamente, no que la persona navegue contenido primero.
  entrenar: {
    subject: "¡Bienvenido, {name}! 💪 Empecemos a entrenar",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por registrarte con interés en entrenar conmigo. Entra a mi página de entrenamiento para conocer todo el proceso:

${SITE_URL}/entrenar

${FOLLOW_LINE}

Nos vemos adentro. 💪
— Cristian Barbosa`,
  },
  coaching: {
    subject: "¡Hola {name}! Hablemos de tu coaching personalizado",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por tu interés en coaching personalizado. Escríbeme directo por WhatsApp para coordinar los detalles y cerrar tu plan:

${SITE_URL}/go/whatsapp-commercial

${FOLLOW_LINE}

Hablamos pronto.
— Cristian Barbosa`,
  },
  shows: {
    subject: "¡Hola {name}! Gracias por tu interés en un show",
    body: `¡Hola {name}!

Soy Cristian Barbosa. Gracias por tu interés en un show — entra aquí para ver más y coordinar los detalles:

${SITE_URL}/shows

${FOLLOW_LINE}

Nos hablamos pronto. 🎤
— Cristian Barbosa`,
  },
  marcas: {
    subject: "¡Hola {name}! Hablemos de trabajar juntos",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por tu interés en trabajar juntos. Entra aquí para conocer más y contactarme directamente:

${SITE_URL}/marcas

${FOLLOW_LINE}

Hablamos pronto. 🤝
— Cristian Barbosa`,
  },
  musica: {
    subject: "¡Hola {name}! Bienvenido a la música 🎶",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por tu interés en la música. Entra aquí para escuchar y conocer más:

${SITE_URL}/musica

${FOLLOW_LINE}

— Cristian Barbosa 🎶`,
  },
  productos_fisicos: {
    subject: "¡Hola {name}! Esto es lo que tenemos para ti",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por tu interés en los productos físicos. Entra aquí para ver todo el catálogo:

${SITE_URL}/productos

${FOLLOW_LINE}

— Cristian Barbosa`,
  },
  productos_digitales: {
    subject: "¡Hola {name}! Esto es lo que tenemos para ti",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por tu interés en los productos digitales. Entra aquí para ver todo el catálogo:

${SITE_URL}/productos

${FOLLOW_LINE}

— Cristian Barbosa`,
  },
  general: {
    subject: "¡Hola {name}! Gracias por registrarte",
    body: `¡Hola {name}!

Soy Cristian Barbosa, gracias por registrarte. Entra a mi sitio para conocer todo lo que hago — entrenamientos, música, shows, productos y más:

${SITE_URL}/

${FOLLOW_LINE}

Un abrazo.
— Cristian Barbosa`,
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
