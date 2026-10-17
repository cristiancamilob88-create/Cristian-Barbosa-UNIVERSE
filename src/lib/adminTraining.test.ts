import { describe, expect, it } from "vitest";
import { invitationMessage, whatsappLink } from "./adminTraining";

describe("whatsappLink", () => {
  it("adds Colombia's 57 to a bare 10-digit mobile", () => {
    expect(whatsappLink("300 123 4567", "hola")).toBe("https://wa.me/573001234567?text=hola");
  });

  it("keeps a number that already has its country code", () => {
    expect(whatsappLink("+57 300 123 4567", "hola")).toBe("https://wa.me/573001234567?text=hola");
    expect(whatsappLink("+1 (555) 010-9999", "x")).toBe("https://wa.me/15550109999?text=x");
  });

  it("is null when there's no usable number", () => {
    expect(whatsappLink(null, "x")).toBeNull();
    expect(whatsappLink("123", "x")).toBeNull();
  });

  it("URL-encodes the message", () => {
    expect(whatsappLink("3001234567", "¡Hola Ana!")).toContain("text=%C2%A1Hola%20Ana!");
  });
});

describe("invitationMessage", () => {
  it("greets by first name and links the sign-in page on the given origin", () => {
    const text = invitationMessage("Ana María Pérez", "https://cristian-barbosa-universe.vercel.app");
    expect(text).toContain("¡Hola Ana!");
    expect(text).toContain("https://cristian-barbosa-universe.vercel.app/mi-plan/entrar");
  });

  it("still reads well without a name", () => {
    expect(invitationMessage(null, "https://x.test")).toMatch(/^¡Hola! Tu cupo/);
  });
});
