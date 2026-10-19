import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { goLinks } from "@/config/site";

/**
 * "¿Lo quieres en tu pueblo?" right under the tour map (Cristian,
 * 2026-10-19): the map drew 12 visits from one story and nobody went on
 * to ask for a show — the ask sat at the bottom of the page. `topic`
 * tells the CTAs report which page's map it was.
 */
export function MapHireBand({ topic }: { topic: string }) {
  return (
    <div className="mt-4 flex flex-col gap-4 bg-ink-raised p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-lg text-chalk">¿Lo quieres en tu pueblo, colegio o evento?</p>
      <div className="flex flex-wrap gap-3">
        <TrackedLink
          event={{ name: "cta_click", cta: "intent_shows", topic }}
          href="/contacto?topic=shows"
          className="inline-flex w-fit items-center bg-ember px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-chalk"
        >
          Quiero contratar un show
        </TrackedLink>
        <GoLink
          slug={goLinks.whatsappCommercial}
          className="inline-flex w-fit items-center bg-chalk px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-ember"
        >
          Escribir por WhatsApp
        </GoLink>
      </div>
    </div>
  );
}
