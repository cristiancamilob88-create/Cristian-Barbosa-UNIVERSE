import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const original = {
  META_WHATSAPP_ACCESS_TOKEN: process.env.META_WHATSAPP_ACCESS_TOKEN,
  META_WHATSAPP_PHONE_NUMBER_ID: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearEnv() {
  delete process.env.META_WHATSAPP_ACCESS_TOKEN;
  delete process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

describe("sendWelcomeWhatsApp", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearEnv();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    restoreEnv();
    vi.unstubAllGlobals();
  });

  it("skips silently when Meta credentials aren't configured", async () => {
    vi.resetModules();
    const { sendWelcomeWhatsApp } = await import("./whatsapp");

    await sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips a topic whose template is still a placeholder", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "a".repeat(30);
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    // The shipped templates are real copy now (2026-08-28, Cristian
    // approved them) — force this one topic back to a placeholder so the
    // test still exercises the guard, not the real templates' content.
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.entrenar = { body: "[PENDIENTE — x]" };

    await whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips a phone number it can't normalize, even when everything else is ready", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "a".repeat(30);
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.general = { body: "Hola {name}!" };

    await whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "12345", topic: "general" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Meta's Graph API once configured, the template is real, and the phone normalizes", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "a".repeat(30);
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.entrenar = { body: "Hola {name}, gracias por registrarte." };

    await whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/1234567890/messages");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe(`Bearer ${"a".repeat(30)}`);
    expect(JSON.parse(options.body)).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+573001234567",
      type: "text",
      text: { body: "Hola Ana, gracias por registrarte." },
    });
  });

  it("never throws when Meta's API responds with an error", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "a".repeat(30);
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "invalid token" });
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.general = { body: "Hola {name}!" };

    await expect(
      whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "general" }),
    ).resolves.toBeUndefined();
  });

  it("never throws when fetch itself rejects (network failure)", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "a".repeat(30);
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.general = { body: "Hola {name}!" };

    await expect(
      whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "general" }),
    ).resolves.toBeUndefined();
  });
});
