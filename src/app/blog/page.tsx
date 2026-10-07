import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { buildMetadata } from "@/lib/seo";
import { blogIndexPath, blogPostPath, blogPosts } from "@/content/blog";
import { formatPostDate } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Blog — historias, shows y música",
  description:
    "La historia de Cristian Barbosa contada por capítulos: cómo empezó en la calistenia, cómo es un show por dentro y su música.",
  path: blogIndexPath,
});

export default function BlogPage() {
  const posts = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <>
      <PageHero
        tag="BLOG"
        title="Blog"
        description="Historias, shows y música — el universo de Cristian Barbosa contado por capítulos."
      />
      <section className="py-16">
        <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={blogPostPath(post.slug)}
              className="group flex flex-col overflow-hidden border border-steel-dim/40 bg-ink transition-colors hover:border-ember"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={post.cover.src}
                  alt={post.cover.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-tide">
                  {post.category} · {formatPostDate(post.publishedAt)}
                </p>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
                  {post.title}
                </h2>
                <p className="text-sm text-steel">{post.description}</p>
                <p className="mt-auto pt-2 text-sm font-semibold uppercase tracking-wide text-ember">Leer →</p>
              </div>
            </Link>
          ))}
        </Container>
      </section>
    </>
  );
}
