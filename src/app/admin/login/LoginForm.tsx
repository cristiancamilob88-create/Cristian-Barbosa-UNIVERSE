"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-8 flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-steel">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="rounded border border-steel-dim/60 bg-ink-raised px-4 py-3 text-chalk outline-none focus:border-ember"
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-rust">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ember px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
