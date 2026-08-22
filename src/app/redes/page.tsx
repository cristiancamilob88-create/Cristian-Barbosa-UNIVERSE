import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GoLink } from "@/components/ui/GoLink";
import { buildMetadata } from "@/lib/seo";
import { getPool } from "@/server/db/pool";
import { listActiveSocialProfiles } from "@/server/db/repositories/socialProfile";

export const metadata: Metadata = buildMetadata({
  title: "Redes",
  description: "Todos los canales oficiales de Cristian Barbosa, en un solo lugar.",
  path: "/redes",
});

// This route queries the database directly (unlike the shared Header/Footer,
// which stay static — see docs/SOCIAL_ROUTING.md for why) since it's the
// one page whose entire purpose is presenting social_profile fully.
export const dynamic = "force-dynamic";

export default async function RedesPage() {
  const profiles = await listActiveSocialProfiles(getPool());

  return (
    <>
      <PageHero
        tag="NETWORK"
        title="Redes"
        description="Todos los canales oficiales — sin cuentas falsas, sin intermediarios."
      />
      <section className="py-16">
        <Container>
          {profiles.length === 0 ? (
            <p className="text-sm text-steel">Todavía no hay canales publicados.</p>
          ) : (
            <ul className="grid gap-px overflow-hidden border border-steel-dim/40 bg-steel-dim/40 sm:grid-cols-2">
              {profiles.map((profile) => (
                <li key={profile.id} className="bg-ink">
                  <GoLink
                    slug={profile.slug}
                    className="group flex items-center justify-between gap-4 p-6 transition-colors hover:bg-ink-raised"
                  >
                    <span className="font-display text-xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
                      {profile.label}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-steel-dim">
                      {profile.platform}
                    </span>
                  </GoLink>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
