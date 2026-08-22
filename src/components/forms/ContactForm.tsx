"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { track } from "@/lib/analytics";

const topics = [
  { value: "entrenar", label: "Entrenamiento" },
  { value: "coaching", label: "Coaching personalizado" },
  { value: "shows", label: "Shows" },
  { value: "marcas", label: "Marcas y partnerships" },
  { value: "musica", label: "Música" },
  { value: "productos", label: "Productos" },
  { value: "general", label: "Otro" },
] as const;

const clientSchema = z.object({
  name: z.string().trim().min(2, "Cuéntanos tu nombre completo."),
  email: z.string().trim().email("Escribe un correo válido."),
  topic: z.enum(topics.map((t) => t.value) as [string, ...string[]]),
  message: z.string().trim().max(2000).optional(),
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
      topic: String(formData.get("topic") ?? "general"),
      message: String(formData.get("message") ?? ""),
      company: String(formData.get("company") ?? ""), // honeypot
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
