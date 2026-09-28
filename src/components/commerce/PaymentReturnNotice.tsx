"use client";

import { useEffect, useState } from "react";
import { GoLink } from "@/components/ui/GoLink";
import { goLinks } from "@/config/site";

type ReturnStatus = "approved" | "pending" | "failure" | null;

/**
 * What a buyer sees when Mercado Pago sends them back to the offer's
 * page (`back_urls` → landing_path, src/server/commerce/mercadopago.ts).
 * Mercado Pago appends `collection_status`/`status` to that URL; this
 * reads it client-side so the page itself stays static. It's only a
 * message — the order is recorded by the webhook, never from this URL,
 * which anyone could type.
 */
export function PaymentReturnNotice({ whatNext }: { whatNext: string }) {
  const [status, setStatus] = useState<ReturnStatus>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("collection_status") ?? params.get("status");
    const next: ReturnStatus =
      raw === "approved" ? "approved" : raw === "pending" || raw === "in_process" ? "pending" : raw ? "failure" : null;
    // One-shot sync from the URL Mercado Pago redirected to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next) setStatus(next);
  }, []);

  if (!status) return null;

  const copy = {
    approved: { title: "¡Pago recibido!", body: whatNext, tone: "border-tide text-tide" },
    pending: {
      title: "Tu pago está en proceso",
      body: "Mercado Pago lo está confirmando. Apenas se apruebe te escribimos; si quieres, avísanos por WhatsApp.",
      tone: "border-steel text-chalk",
    },
    failure: {
      title: "El pago no se completó",
      body: "No se hizo ningún cobro. Puedes intentarlo de nuevo o escribirnos por WhatsApp si necesitas ayuda.",
      tone: "border-ember text-ember",
    },
  }[status];

  return (
    <div role="status" className={`border bg-ink-raised p-6 ${copy.tone}`}>
      <p className="font-display text-xl font-black uppercase tracking-tight">{copy.title}</p>
      <p className="mt-2 text-sm text-steel">{copy.body}</p>
      <GoLink
        slug={goLinks.whatsappCommercial}
        className="mt-4 inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
      >
        Escribir por WhatsApp
      </GoLink>
    </div>
  );
}
