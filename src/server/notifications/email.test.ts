import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The one `vi.mock` in this codebase (everything else here prefers a
 * real disposable Postgres over mocking, per docs/ANALYTICS_ENGINE.md's
 * "Testing") — justified because the alternative is actually opening an
 * SMTP connection to Gmail from a test run, which is not something any
 * other test in this app does either.
 */
const sendMail = vi.fn().mockResolvedValue({ messageId: "test" });
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const original = {
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    sendMail.mockClear();
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  afterEach(() => {
    restoreEnv();
  });

  it("skips silently when GMAIL_USER/GMAIL_APP_PASSWORD aren't configured", async () => {
    vi.resetModules();
    const { sendWelcomeEmail } = await import("./email");

    await sendWelcomeEmail({ name: "Ana", email: "ana@example.com", topic: "entrenar" });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("skips a topic whose template is still a placeholder, even when Gmail is configured", async () => {
    process.env.GMAIL_USER = "cristian@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    vi.resetModules();
    const emailModule = await import("./email");
    const templatesModule = await import("./emailTemplates");
    // The shipped templates are real copy now (2026-08-28, Cristian
    // approved them) — force this one topic back to a placeholder so the
    // test still exercises the guard, not the real templates' content.
    templatesModule.WELCOME_EMAIL_TEMPLATES.entrenar = { subject: "[PENDIENTE] x", body: "[PENDIENTE — x]" };

    await emailModule.sendWelcomeEmail({ name: "Ana", email: "ana@example.com", topic: "entrenar" });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends via the Gmail transport once configured and the template is real", async () => {
    process.env.GMAIL_USER = "cristian@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    vi.resetModules();
    const emailModule = await import("./email");
    const templatesModule = await import("./emailTemplates");

    // Simulate Cristian having replaced the placeholder for one topic —
    // done in-memory on the freshly-imported module, never touching the
    // real shipped file.
    templatesModule.WELCOME_EMAIL_TEMPLATES.entrenar = {
      subject: "Bienvenido {name}",
      body: "Gracias por registrarte, {name}.",
    };

    await emailModule.sendWelcomeEmail({ name: "Ana", email: "ana@example.com", topic: "entrenar" });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "cristian@example.com",
        to: "ana@example.com",
        subject: "Bienvenido Ana",
        text: "Gracias por registrarte, Ana.",
      }),
    );
  });

  it("strips spaces from the App Password before authenticating", async () => {
    const nodemailer = (await import("nodemailer")).default;
    process.env.GMAIL_USER = "cristian@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    vi.resetModules();
    const emailModule = await import("./email");
    const templatesModule = await import("./emailTemplates");
    templatesModule.WELCOME_EMAIL_TEMPLATES.general = { subject: "Hola", body: "Bienvenido." };

    await emailModule.sendWelcomeEmail({ name: "Ana", email: "ana@example.com", topic: "general" });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ pass: "abcdefghijklmnop" }) }),
    );
  });

  it("never throws when sendMail itself fails", async () => {
    process.env.GMAIL_USER = "cristian@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    sendMail.mockRejectedValueOnce(new Error("SMTP down"));
    vi.resetModules();
    const emailModule = await import("./email");
    const templatesModule = await import("./emailTemplates");
    templatesModule.WELCOME_EMAIL_TEMPLATES.general = { subject: "Hola", body: "Bienvenido." };

    await expect(
      emailModule.sendWelcomeEmail({ name: "Ana", email: "ana@example.com", topic: "general" }),
    ).resolves.toBeUndefined();
  });
});
