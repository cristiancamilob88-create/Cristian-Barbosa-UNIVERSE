import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn().mockResolvedValue({ sid: "test" });
vi.mock("twilio", () => ({
  default: vi.fn(() => ({ messages: { create } })),
}));

const original = {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearEnv() {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_WHATSAPP_FROM;
}

describe("sendWelcomeWhatsApp", () => {
  beforeEach(() => {
    create.mockClear();
    clearEnv();
  });

  afterEach(() => {
    restoreEnv();
  });

  it("skips silently when Twilio credentials aren't configured", async () => {
    vi.resetModules();
    const { sendWelcomeWhatsApp } = await import("./whatsapp");

    await sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(create).not.toHaveBeenCalled();
  });

  it("skips when credentials exist but TWILIO_WHATSAPP_FROM is missing", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    process.env.TWILIO_AUTH_TOKEN = "authtoken1234567890";
    vi.resetModules();
    const { sendWelcomeWhatsApp } = await import("./whatsapp");

    await sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(create).not.toHaveBeenCalled();
  });

  it("skips a topic whose template is still a placeholder", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    process.env.TWILIO_AUTH_TOKEN = "authtoken1234567890";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.resetModules();
    const { sendWelcomeWhatsApp } = await import("./whatsapp");

    await sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(create).not.toHaveBeenCalled();
  });

  it("skips a phone number it can't normalize, even when everything else is ready", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    process.env.TWILIO_AUTH_TOKEN = "authtoken1234567890";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.general = { body: "Hola {name}!" };

    await whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "12345", topic: "general" });

    expect(create).not.toHaveBeenCalled();
  });

  it("sends via Twilio once configured, the template is real, and the phone normalizes", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    process.env.TWILIO_AUTH_TOKEN = "authtoken1234567890";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.entrenar = { body: "Hola {name}, gracias por registrarte." };

    await whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "entrenar" });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+573001234567",
      body: "Hola Ana, gracias por registrarte.",
    });
  });

  it("never throws when Twilio itself fails", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    process.env.TWILIO_AUTH_TOKEN = "authtoken1234567890";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    create.mockRejectedValueOnce(new Error("Twilio down"));
    vi.resetModules();
    const whatsappModule = await import("./whatsapp");
    const templatesModule = await import("./whatsappTemplates");
    templatesModule.WELCOME_WHATSAPP_TEMPLATES.general = { body: "Hola {name}!" };

    await expect(
      whatsappModule.sendWelcomeWhatsApp({ name: "Ana", phone: "3001234567", topic: "general" }),
    ).resolves.toBeUndefined();
  });
});
