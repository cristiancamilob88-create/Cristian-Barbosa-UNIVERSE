import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { agendaHref, goLinks, siteConfig } from "@/config/site";
import { getPastShow, pastShowPath, pastShows } from "@/config/pastShows";
import { personId } from "@/lib/structuredData";

export function generateStaticParams() {
  return pastShows.map((show) => ({ slug: show.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const show = getPastShow(slug);
  if (!show) return {};
  return buildMetadata({
    title: `Show en ${show.town}, ${show.region}`,
    description: show.summary,
    path: pastShowPath(show.slug),
  });
}

/**
 * One real show (src/config/pastShows.ts). Carries schema.org Event
 * structured data — a past event with a real town, so it can surface
 * for "show <municipio>" searches and tie back to Cristian as performer.
 */
export default async function PastShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = getPastShow(slug);
  if (!show) notFound();

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${show.title} — ${siteConfig.name}`,
    description: show.summary,
    startDate: show.startDate,
    ...(show.endDate ? { endDate: show.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue ?? show.town,
      geo: { "@type": "GeoCoordinates", latitude: show.geo.lat, longitude: show.geo.lng },
      address: {
        "@type": "PostalAddress",
        addressLocality: show.town,
        addressRegion: show.region,
        addressCountry: "CO",
      },
    },
    performer: { "@id": personId, "@type": "Person", name: siteConfig.name },
    ...(show.image ? { image: new URL(show.image.src, siteConfig.url).toString() } : {}),
    url: new URL(pastShowPath(show.slug), siteConfig.url).toString(),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <PageHero tag={`SHOW · ${show.town.toUpperCase()}`} title={show.title} description={`${show.town}, ${show.region} · ${show.whenLabel}`} />
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {show.image ? (
            <div className="overflow-hidden border border-steel-dim/40">
              <Image
                src={show.image.src}
                alt={show.image.alt}
                width={show.image.width}
                height={show.image.height}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-6">
            <p className="text-lg text-chalk">{show.summary}</p>
            <ul className="flex flex-col gap-3 border-t border-steel-dim/40 pt-6">
              {show.details.map((detail) => (
                <li key={detail} className="flex gap-3 text-sm text-steel">
                  <span className="text-ember">◆</span>
                  {detail}
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-4 border-t border-steel-dim/40 pt-6 text-sm">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-steel-dim">Lugar</dt>
                <dd className="mt-1 text-chalk">{show.venue ?? show.town}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-steel-dim">Municipio</dt>
                <dd className="mt-1 text-chalk">{show.town}, {show.region}</dd>
              </div>
              {show.collaborator && (
                <div>
                  <dt className="font-mono text-xs uppercase tracking-widest text-steel-dim">Junto a</dt>
                  <dd className="mt-1 text-chalk">
                    {show.collaborator.name} · {show.collaborator.role}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-4 pt-2">
              <TrackedLink
                event={{ name: "cta_click", cta: "intent_shows", topic: `show_${show.slug}` }}
                href="/contacto?topic=shows"
                className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
              >
                Quiero un show así
              </TrackedLink>
              <GoLink
                slug={goLinks.whatsappCommercial}
                className="inline-flex w-fit items-center border border-chalk px-6 py-3 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
              >
                Escribir por WhatsApp
              </GoLink>
            </div>
            <Link href={agendaHref} className="text-sm text-steel underline underline-offset-4 hover:text-chalk">
              ← Ver la agenda y todos los shows
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
