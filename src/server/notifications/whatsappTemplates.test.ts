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

  it("every shipped template is still a placeholder — none invented here", () => {
    for (const template of Object.values(WELCOME_WHATSAPP_TEMPLATES)) {
      expect(isPendingWhatsAppTemplate(template)).toBe(true);
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
