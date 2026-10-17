"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "code";

const inputClass =
  "w-full border border-steel-dim/60 bg-ink-raised px-4 py-3 text-chalk outline-none placeholder:text-steel-dim focus:border-ember";
const buttonClass =
  "w-full bg-ember px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust disabled:opacity-60";

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string; message?: string; needsConsent?: boolean }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Sin conexión. Revisa tu internet e intenta de nuevo." };
  }
}

export function MemberLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setPending(true);
    const result = await postJson("/api/member/login/request", { email });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "No pudimos enviar el código.");
      return;
    }
    setNotice(result.message ?? null);
    setCode("");
    setStep("code");
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await postJson("/api/member/login/verify", { email, code, consent });
    if (result.ok) {
      router.replace("/mi-plan");
      router.refresh();
      return;
    }
    setPending(false);
    if (result.needsConsent) setNeedsConsent(true);
    setError(result.error ?? "No pudimos verificar el código.");
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="mt-8 flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-steel">Correo</span>
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-ember">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Enviando…" : "Enviarme el código"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="mt-8 flex max-w-sm flex-col gap-4">
      {notice && <p className="text-sm text-steel">{notice}</p>}
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-steel">Código de 6 dígitos</span>
        <input
          type="text"
          name="code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} font-mono text-2xl tracking-[0.5em]`}
        />
      </label>
      {needsConsent && (
        <label className="flex items-start gap-3 text-sm text-steel">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 accent-ember"
          />
          <span>
            Autorizo el tratamiento de mis datos personales según la{" "}
            <Link href="/privacidad" className="text-chalk underline underline-offset-4" target="_blank">
              política de privacidad
            </Link>
            .
          </span>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending || code.length !== 6} className={buttonClass}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <div className="flex justify-between gap-4 text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
            setNeedsConsent(false);
          }}
          className="text-steel underline underline-offset-4 hover:text-chalk"
        >
          Usar otro correo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => requestCode()}
          className="text-steel underline underline-offset-4 hover:text-chalk disabled:opacity-60"
        >
          Reenviar código
        </button>
      </div>
    </form>
  );
}
