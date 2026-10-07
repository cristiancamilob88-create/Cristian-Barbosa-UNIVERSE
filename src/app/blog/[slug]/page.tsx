import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { blogIndexPath, blogPostPath, blogPosts, getBlogPost } from "@/content/blog";
import { formatPostDate } from "@/lib/format";
import { personId } from "@/lib/structuredData";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return buildMetadata({ title: post.title, description: post.description, path: blogPostPath(post.slug) });
}

/** Where each category's reader most likely wants to go next. */
const nextStep = {
  Historia: { href: "/about", label: "Conoce toda su historia", cta: "intent_story" },
  Shows: { href: "/contacto?topic=shows", label: "Quiero un show así", cta: "intent_shows" },
  Música: { href: "/musica", label: "Escuchar su música", cta: "intent_music" },
} as const;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = new URL(blogPostPath(post.slug), siteConfig.url).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    inLanguage: "es",
    image: new URL(post.cover.src, siteConfig.url).toString(),
    mainEntityOfPage: url,
    url,
    author: { "@id": personId, "@type": "Person", name: siteConfig.name },
    about: { "@id": personId },
  };
  const step = nextStep[post.category];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <header className="border-b border-steel-dim/40 pb-10 pt-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">
            {post.category} · {formatPostDate(post.publishedAt)}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-chalk sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-steel">{post.description}</p>
        </Container>
      </header>
      <Container className="py-12">
        <div className="relative mb-12 aspect-[16/9] max-w-3xl overflow-hidden border border-steel-dim/40">
          <Image src={post.cover.src} alt={post.cover.alt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
        <div className="flex max-w-2xl flex-col gap-8">
          {post.sections.map((section, i) => (
            <section key={section.heading ?? i} className="flex flex-col gap-4">
              {section.heading && (
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-chalk">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-steel">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-12 flex max-w-2xl flex-wrap items-center gap-6 border-t border-steel-dim/40 pt-8">
          <TrackedLink
            event={{ name: "cta_click", cta: step.cta, topic: `blog_${post.slug}` }}
            href={step.href}
            className="inline-flex w-fit items-center bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-chalk"
          >
            {step.label}
          </TrackedLink>
          <Link href={blogIndexPath} className="text-sm text-steel underline underline-offset-4 hover:text-chalk">
            ← Más historias
          </Link>
        </div>
      </Container>
    </article>
  );
}
