import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contacto",
  description: "Escríbele al equipo de Cristian Barbosa — shows, marcas, coaching o preguntas generales.",
  path: "/contacto",
});

const VALID_TOPICS = new Set(["entrenar", "coaching", "shows", "marcas", "musica", "productos", "general"]);
// /entrenar links to specific coaching tiers (?topic=coaching-essential, etc.) that don't need
// their own form option — they all resolve to the same "coaching" topic/interest.
const TOPIC_ALIASES: Record<string, string> = {
  "coaching-essential": "coaching",
  "coaching-performance": "coaching",
  "coaching-elite": "coaching",
};

export default async function ContactoPage(props: PageProps<"/contacto">) {
  const params = await props.searchParams;
  const rawTopic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const resolvedTopic = rawTopic ? (TOPIC_ALIASES[rawTopic] ?? rawTopic) : undefined;
  const initialTopic = resolvedTopic && VALID_TOPICS.has(resolvedTopic) ? resolvedTopic : "general";

  return (
    <>
      <PageHero
        tag="CONTACT"
        title="Contacto"
        description="Shows, marcas, coaching o una pregunta general — cuéntanos y te respondemos."
      />
      <section className="py-16">
        <Container className="max-w-xl">
          <ContactForm initialTopic={initialTopic} />
        </Container>
      </section>
    </>
  );
}
