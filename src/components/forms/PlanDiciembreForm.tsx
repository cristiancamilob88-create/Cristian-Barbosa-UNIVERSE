"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { legalEntity } from "@/config/legal";
import { OBJECTIVE_LABEL, TRAINING_ZONES } from "@/lib/training";

/**
 * Plan Diciembre sign-up (/entrenar/plan-diciembre). Posts to the same
 * /api/lead as ContactForm — one intake path, one set of CRM rules — with
 * topic "plan_diciembre", which also opens a pending enrollment that
 * Cristian approves from /admin/alumnos (docs/TRAINING.md). Field rules
 * mirror ContactForm's; /api/lead is the real enforcement.
 */

const clientSchema = z.object({
  name: z.string().trim().min(2, "Cuéntanos tu nombre completo."),
  email: z.string().trim().email("Escribe un correo válido."),
  phone: z
    .string()
    .trim()
    .min(7, "Escribe un número de celular válido.")
    .max(20, "Escribe un número de celular válido.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios y +()- ."),
  trainingZone: z.string().trim().max(80),
  trainingObjective: z.enum(["bajar_peso", "fuerza", "tonificar", "skills", "general"], {
    error: "Elige tu objetivo principal.",
  }),
  trainingGoal: z.string().trim().max(300),
  consent: z.literal(true, { error: "Para inscribirte, autoriza el tratamiento de tus datos." }),
});

const inputClass =
  "border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none";
const labelClass = "font-mono text-xs uppercase tracking-widest text-steel";

type Status = "idle" | "submitting" | "success" | "error";

export function PlanDiciembreForm() {
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
      trainingZone: String(formData.get("trainingZone") ?? ""),
      trainingObjective: String(formData.get("trainingObjective") ?? ""),
      trainingGoal: String(formData.get("trainingGoal") ?? ""),
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
        body: JSON.stringify({
          ...values,
          topic: "plan_diciembre",
          message: values.trainingGoal ? `Meta: ${values.trainingGoal}` : "",
          company: String(formData.get("company") ?? ""), // honeypot
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(body?.error ?? "No pudimos enviar tu inscripción. Intenta de nuevo.");
        setStatus("error");
        return;
      }
      track({ name: "lead_submit", topic: "plan_diciembre" });
      setStatus("success");
    } catch {
      setErrorMessage("No pudimos enviar tu inscripción. Revisa tu conexión e intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-ember/60 bg-ink-raised p-8">
        <p className="font-display text-2xl font-black uppercase tracking-tight text-ember">Inscripción recibida</p>
        <p className="mt-3 text-steel">
          Te escribo por WhatsApp para agendar tu valoración gratis de 20 minutos y cuadrar el día de arranque. Cuando
          confirmemos tu cupo te llega el acceso a tu app.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="pd-name" className={labelClass}>
          Nombre
        </label>
        <input id="pd-name" name="name" type="text" required minLength={2} autoComplete="name" className={inputClass} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="pd-email" className={labelClass}>
            Correo
          </label>
          <input id="pd-email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pd-phone" className={labelClass}>
            Celular (WhatsApp)
          </label>
          <input
            id="pd-phone"
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={20}
            autoComplete="tel"
            placeholder="300 123 4567"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pd-zone" className={labelClass}>
          ¿Dónde entrenarías?
        </label>
        <select id="pd-zone" name="trainingZone" defaultValue={TRAINING_ZONES[0]} className={`${inputClass} bg-ink`}>
          {TRAINING_ZONES.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pd-objective" className={labelClass}>
          Tu objetivo principal
        </label>
        <select id="pd-objective" name="trainingObjective" required defaultValue="" className={`${inputClass} bg-ink`}>
          <option value="" disabled>
            Elige uno
          </option>
          {Object.entries(OBJECTIVE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pd-goal" className={labelClass}>
          En tus palabras, ¿qué quieres lograr? (opcional)
        </label>
        <input
          id="pd-goal"
          name="trainingGoal"
          type="text"
          maxLength={300}
          placeholder="Ej: mi primera dominada, bajar de peso, sentirme más fuerte"
          className={inputClass}
        />
      </div>

      {/* Mandatory data-processing authorization (Ley 1581 de 2012), same as ContactForm — unchecked by default. */}
      <div className="flex items-start gap-3">
        <input id="pd-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-ember" />
        <label htmlFor="pd-consent" className="text-sm text-steel">
          Autorizo a {legalEntity.name} a tratar mis datos personales para gestionar mi inscripción y mi plan de
          entrenamiento, según la{" "}
          <Link href="/privacidad" target="_blank" className="text-chalk underline underline-offset-4 hover:text-ember">
            política de privacidad
          </Link>
          .
        </label>
      </div>

      {/* Honeypot — hidden from real visitors, catches basic bots. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-ember">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk disabled:opacity-50"
      >
        {status === "submitting" ? "Enviando..." : "Quiero mi cupo"}
      </button>
    </form>
  );
}
