"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { legalEntity } from "@/config/legal";

const topics = [
  { value: "entrenar", label: "Entrenamiento" },
  { value: "coaching", label: "Coaching personalizado" },
  { value: "shows", label: "Shows" },
  { value: "marcas", label: "Marcas y partnerships" },
  { value: "musica", label: "Música" },
  { value: "productos_fisicos", label: "Productos físicos" },
  { value: "productos_digitales", label: "Productos digitales" },
  { value: "general", label: "Otro" },
] as const;

const clientSchema = z.object({
  name: z.string().trim().min(2, "Cuéntanos tu nombre completo."),
  email: z.string().trim().email("Escribe un correo válido."),
  // Required, not optional — WhatsApp is this site's real follow-up
  // channel throughout (community, comercial, subscriptions), so a lead
  // without a number is a lead the team can't actually reach the way
  // most people expect to be reached.
  phone: z
    .string()
    .trim()
    .min(7, "Escribe un número de celular válido.")
    .max(20, "Escribe un número de celular válido.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios y +()- ."),
  topic: z.enum(topics.map((t) => t.value) as [string, ...string[]]),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { error: "Para enviar, autoriza el tratamiento de tus datos." }),
});

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm({ initialTopic }: { initialTopic: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      topic: String(formData.get("topic") ?? "general"),
      message: String(formData.get("message") ?? ""),
      company: String(formData.get("company") ?? ""), // honeypot
      consent: formData.get("consent") === "on",
    };

    const parsed = clientSchema.safeParse(values);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(body?.error ?? "No pudimos enviar tu mensaje. Intenta de nuevo.");
        setStatus("error");
        return;
      }

      track({ name: "lead_submit", topic: parsed.data.topic });
      setStatus("success");
    } catch {
      setErrorMessage("No pudimos enviar tu mensaje. Revisa tu conexión e intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-ember/60 bg-ink-raised p-8">
        <p className="font-display text-xl font-black uppercase tracking-tight text-ember">
          Mensaje enviado
        </p>
        <p className="mt-2 text-sm text-steel">
          Gracias — el equipo de Cristian Barbosa te responderá pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-steel">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          autoComplete="name"
          className="border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-steel">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="font-mono text-xs uppercase tracking-widest text-steel">
          Celular (WhatsApp)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          minLength={7}
          maxLength={20}
          autoComplete="tel"
          placeholder="300 123 4567"
          className="border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="topic" className="font-mono text-xs uppercase tracking-widest text-steel">
          Motivo
        </label>
        <select
          id="topic"
          name="topic"
          defaultValue={initialTopic}
          className="border border-steel-dim/50 bg-ink px-4 py-3 text-chalk focus:border-ember focus:outline-none"
        >
          {topics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="font-mono text-xs uppercase tracking-widest text-steel">
          Mensaje (opcional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className="border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none"
        />
      </div>

      {/* Mandatory data-processing authorization (Ley 1581 de 2012).
          Unchecked by default — pre-ticked consent isn't valid consent.
          /api/lead rejects the request without it and stores the date. */}
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-ember"
        />
        <label htmlFor="consent" className="text-sm text-steel">
          Autorizo a {legalEntity.name} a tratar mis datos personales para
          responder mi solicitud y enviarme información relacionada, según la{" "}
          <Link href="/privacidad" target="_blank" className="text-chalk underline underline-offset-4 hover:text-ember">
            política de privacidad
          </Link>
          .
        </label>
      </div>

      {/* Honeypot — hidden from real visitors, catches basic bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-ember">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-fit items-center border border-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink disabled:opacity-50"
      >
        {status === "submitting" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
