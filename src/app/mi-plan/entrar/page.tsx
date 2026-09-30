import type { Metadata } from "next";
import { MemberLoginForm } from "./MemberLoginForm";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Public — proxy.ts sends a student who's already signed in straight to
 * /mi-plan instead. Sign-in is email + a 6-digit code, no password
 * (docs/TRAINING.md, "Sign-in").
 */
export default function MemberLoginPage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Plan Diciembre</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-chalk sm:text-5xl">
        Entra a tu plan
      </h1>
      <p className="mt-4 max-w-md text-steel">
        Escribe el correo con el que te inscribiste. Te llega un código de 6 dígitos para entrar, sin contraseña.
      </p>
      <MemberLoginForm />
    </>
  );
}
