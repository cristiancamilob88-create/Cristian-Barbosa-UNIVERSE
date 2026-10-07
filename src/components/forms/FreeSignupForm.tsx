"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { legalEntity } from "@/config/legal";
import { OBJECTIVE_LABEL } from "@/lib/training";
import { MemberLoginForm } from "@/app/mi-plan/entrar/MemberLoginForm";

const inputClass =
  "border border-steel-dim/50 bg-transparent px-4 py-3 text-chalk placeholder:text-steel-dim focus:border-ember focus:outline-none";
const labelClass = "font-mono text-xs uppercase tracking-widest text-steel";

/**
 * Free sign-up (/entrenar/gratis → POST /api/member/signup). On success
 * it turns into the code step of the normal sign-in, email pre-filled, so
 * the whole thing is: name + email + objective → code → inside the app.
 */
export function FreeSignupForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      objective: String(data.get("objective") ?? ""),
      consent: data.get("consent") === "on",
      company: String(data.get("company") ?? ""),
    };
    if (payload.name.length < 2) return setError("Escribe tu nombre.");
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return setError("Escribe un correo válido.");
    if (!payload.objective) return setError("Elige tu objetivo.");
    if (!payload.consent) return setError("Para registrarte, autoriza el tratamiento de tus datos.");

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string } | null;
      if (!res.ok || !body?.ok) {
        setError(body?.error ?? "No pudimos registrarte. Intenta de nuevo.");
        return;
      }
      track({ name: "lead_submit", topic: "app_gratis" });
      setDone({ email: payload.email, message: body.message ?? "Te enviamos un código a tu correo." });
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <MemberLoginForm initialEmail={done.email} initialStep="code" initialNotice={done.message} />;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="fs-name" className={labelClass}>
          Tu nombre
        </label>
        <input id="fs-name" name="name" type="text" autoComplete="name" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="fs-email" className={labelClass}>
          Tu correo
        </label>
        <input id="fs-email" name="email" type="email" autoComplete="email" inputMode="email" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="fs-objective" className={labelClass}>
          ¿Qué quieres lograr?
        </label>
        <select id="fs-objective" name="objective" defaultValue="" required className={`${inputClass} bg-ink`}>
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
      <div className="flex items-start gap-3">
        <input id="fs-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-ember" />
        <label htmlFor="fs-consent" className="text-sm text-steel">
          Autorizo a {legalEntity.name} a tratar mis datos personales para darme acceso a la app y enviarme información
          relacionada, según la{" "}
          <Link href="/privacidad" target="_blank" className="text-chalk underline underline-offset-4 hover:text-ember">
            política de privacidad
          </Link>
          .
        </label>
      </div>
      {/* Honeypot — hidden from real visitors, catches basic bots. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Crear mi cuenta gratis"}
      </button>
      <p className="text-sm text-steel">
        ¿Ya tienes cuenta?{" "}
        <Link href="/mi-plan/entrar" className="text-chalk underline underline-offset-4 hover:text-ember">
          Entra aquí
        </Link>
      </p>
    </form>
  );
}
