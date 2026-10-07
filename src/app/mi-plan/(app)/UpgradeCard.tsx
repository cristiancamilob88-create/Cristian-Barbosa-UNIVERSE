import { CheckoutLink } from "@/components/ui/CheckoutLink";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { formatCents } from "@/lib/format";

/**
 * Free-tier upsell at the bottom of every /mi-plan page (docs/TRAINING.md
 * "Free tier"): the two paid ways up — the Facebook subscription (through
 * CheckoutLink, so checkout_started is recorded) and the 1:1 Plan
 * Diciembre. Only free users see it.
 */
export function UpgradeCard() {
  return (
    <aside className="flex flex-col gap-4 border border-steel-dim/40 bg-ink-raised p-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ember">Sube de nivel</p>
        <p className="mt-2 text-chalk">¿Quieres más que la rutina gratis?</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <CheckoutLink
          offerSlug="facebook-subscription-standard"
          className="inline-flex items-center justify-center border border-chalk px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-chalk hover:bg-chalk hover:text-ink"
        >
          Suscripción · {formatCents(2_990_000)}/mes
        </CheckoutLink>
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_plan_diciembre", topic: "mi_plan_gratis" }}
          href="/entrenar/plan-diciembre"
          className="inline-flex items-center justify-center bg-ember px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-ink hover:bg-rust"
        >
          Plan 1:1 con Cristian
        </TrackedLink>
      </div>
    </aside>
  );
}
