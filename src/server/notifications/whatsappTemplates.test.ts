import { describe, it, expect } from "vitest";
import { WELCOME_WHATSAPP_TEMPLATES, isPendingWhatsAppTemplate, renderWhatsAppTemplate } from "./whatsappTemplates";

describe("WELCOME_WHATSAPP_TEMPLATES", () => {
  it("has a template for every ContactForm topic value", () => {
    const topics = [
      "entrenar",
      "coaching",
      "shows",
      "marcas",
      "musica",
      "productos_fisicos",
      "productos_digitales",
      "general",
    ];
    for (const topic of topics) {
      expect(WELCOME_WHATSAPP_TEMPLATES[topic]).toBeDefined();
    }
  });

  // 2026-08-28: Cristian reviewed and approved these 8 texts in chat
  // ("me gustan los mensajes") before they were written here — still not
  // invented unilaterally, just no longer a placeholder. If a topic ever
  // goes back to `[PENDIENTE...]`, this test catches the regression.
  it("every shipped template is real — none left as a placeholder", () => {
    for (const template of Object.values(WELCOME_WHATSAPP_TEMPLATES)) {
      expect(isPendingWhatsAppTemplate(template)).toBe(false);
    }
  });
});

describe("isPendingWhatsAppTemplate / renderWhatsAppTemplate", () => {
  it("detects the placeholder marker", () => {
    expect(isPendingWhatsAppTemplate({ body: "[PENDIENTE — x]" })).toBe(true);
  });

  it("returns false once the body is real", () => {
    expect(isPendingWhatsAppTemplate({ body: "Hola, gracias por registrarte." })).toBe(false);
  });

  it("substitutes {name}", () => {
    expect(renderWhatsAppTemplate({ body: "Hola {name}!" }, { name: "Ana" })).toBe("Hola Ana!");
  });
});
