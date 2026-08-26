import { describe, it, expect } from "vitest";
import { WELCOME_EMAIL_TEMPLATES, isPendingTemplate, renderTemplate } from "./emailTemplates";

describe("WELCOME_EMAIL_TEMPLATES", () => {
  it("has a template for every ContactForm topic value", () => {
    // Same 8 values as src/components/forms/ContactForm.tsx's `topics`
    // and src/app/api/lead/route.ts's `leadSchema` — kept in sync by
    // hand, this test is the guard against one of them drifting.
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
      expect(WELCOME_EMAIL_TEMPLATES[topic]).toBeDefined();
    }
  });

  it("every shipped template is still a placeholder — none invented here", () => {
    // This test's own failure is the signal that a real template landed:
    // flip it (or delete it) the day a topic's placeholder is replaced
    // with Cristian's real copy.
    for (const template of Object.values(WELCOME_EMAIL_TEMPLATES)) {
      expect(isPendingTemplate(template)).toBe(true);
    }
  });
});

describe("isPendingTemplate", () => {
  it("detects the placeholder marker in the subject", () => {
    expect(isPendingTemplate({ subject: "[PENDIENTE] x", body: "real body" })).toBe(true);
  });

  it("detects the placeholder marker in the body", () => {
    expect(isPendingTemplate({ subject: "Real subject", body: "[PENDIENTE — x]" })).toBe(true);
  });

  it("returns false once both subject and body are real", () => {
    expect(isPendingTemplate({ subject: "Bienvenido", body: "Gracias por registrarte." })).toBe(false);
  });
});

describe("renderTemplate", () => {
  it("substitutes {name} in both subject and body", () => {
    const result = renderTemplate({ subject: "Hola {name}", body: "Bienvenido, {name}." }, { name: "Ana" });
    expect(result.subject).toBe("Hola Ana");
    expect(result.body).toBe("Bienvenido, Ana.");
  });

  it("leaves text without {name} untouched", () => {
    const result = renderTemplate({ subject: "Sin variable", body: "Texto fijo." }, { name: "Ana" });
    expect(result.subject).toBe("Sin variable");
    expect(result.body).toBe("Texto fijo.");
  });
});
