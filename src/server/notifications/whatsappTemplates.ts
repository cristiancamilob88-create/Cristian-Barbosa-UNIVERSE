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

// Producción vive en el dominio de Vercel por ahora (Cristian no ha
// comprado un dominio propio todavía, 2026-08-28) — cambiar aquí el día
// que eso cambie. Mismo valor que NEXT_PUBLIC_SITE_URL debería apuntar
// en Vercel (src/lib/env.ts), pero se escribe literal aquí porque estos
// templates no corren en un contexto con acceso a esa env var validada.
const SITE_URL = "https://cristian-barbosa-universe.vercel.app";

export const WELCOME_WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  entrenar: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés en entrenar conmigo. Entra a ${SITE_URL}/comunidad y únete gratis al grupo de WhatsApp — ahí comparto entrenamientos, tips y todo lo que se viene antes que nadie. 💪`,
  },
  coaching: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por escribirme sobre coaching personalizado — pronto te contacto con los detalles. Mientras tanto, únete gratis a la comunidad de WhatsApp aquí: ${SITE_URL}/comunidad 🔥`,
  },
  shows: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés en un show — en breve te contacto para coordinar los detalles. Entra a ${SITE_URL}/comunidad y únete a la comunidad de WhatsApp para ver contenido y presentaciones anteriores. 🎤`,
  },
  marcas: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés en trabajar juntos — pronto te escribo con más información. Aquí puedes conocer más del proyecto y unirte a la comunidad: ${SITE_URL}/comunidad 🤝`,
  },
  musica: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés en la música — únete gratis a la comunidad de WhatsApp en ${SITE_URL}/comunidad para enterarte primero de cada lanzamiento. 🎶`,
  },
  productos_fisicos: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés en los productos — entra a ${SITE_URL}/productos para ver todo el catálogo, y únete gratis a la comunidad en ${SITE_URL}/comunidad. 🛍️`,
  },
  productos_digitales: {
    body: `¡Hola {name}! 👋 Soy Cristian. Gracias por tu interés — entra a ${SITE_URL}/productos para ver los productos digitales disponibles, y únete gratis a la comunidad en ${SITE_URL}/comunidad. 📲`,
  },
  general: {
    body: `¡Hola {name}! 👋 Soy Cristian Barbosa. Gracias por registrarte. Entra a ${SITE_URL}/comunidad y únete gratis a la comunidad de WhatsApp para conocer todo lo que hago. 💪`,
  },
};

export function isPendingWhatsAppTemplate(template: WhatsAppTemplate): boolean {
  return template.body.includes(PENDING_MARKER);
}

export function renderWhatsAppTemplate(template: WhatsAppTemplate, vars: { name: string }): string {
  return template.body.replaceAll("{name}", vars.name);
}
