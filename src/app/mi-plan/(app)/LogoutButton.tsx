"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/member/logout", { method: "POST" }).catch(() => null);
        router.replace("/mi-plan/entrar");
        router.refresh();
      }}
      className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-steel hover:text-ember disabled:opacity-60"
    >
      Salir
    </button>
  );
}
