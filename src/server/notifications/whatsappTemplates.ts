import "server-only";

/**
 * One welcome-WhatsApp-message template per ContactForm topic — mirrors
 * emailTemplates.ts exactly (same topics, same placeholder-refuses-to-
 * send mechanism, same "Cristian writes the real words" rule). Kept as
 * a separate object, not reused from emailTemplates.ts: a WhatsApp
 * message reads shorter/more direct than an email, so the real text
 * per topic won't be identical even once both are written.
 */

const PENDING_MARKER = "[PENDIENTE";

export interface WhatsAppTemplate {
  body: string;
}

export const WELCOME_WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  entrenar: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Entrenamiento. Usa {name} para el nombre.]" },
  coaching: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Coaching personalizado. Usa {name} para el nombre.]" },
  shows: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Shows. Usa {name} para el nombre.]" },
  marcas: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Marcas y partnerships. Usa {name} para el nombre.]" },
  musica: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Música. Usa {name} para el nombre.]" },
  productos_fisicos: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Productos físicos. Usa {name} para el nombre.]" },
  productos_digitales: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida para Productos digitales. Usa {name} para el nombre.]" },
  general: { body: "[PENDIENTE — Cristian escribe aquí el WhatsApp de bienvenida genérico. Usa {name} para el nombre.]" },
};

export function isPendingWhatsAppTemplate(template: WhatsAppTemplate): boolean {
  return template.body.includes(PENDING_MARKER);
}

export function renderWhatsAppTemplate(template: WhatsAppTemplate, vars: { name: string }): string {
  return template.body.replaceAll("{name}", vars.name);
}
