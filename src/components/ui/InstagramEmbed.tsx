/**
 * Embeds a public Instagram post/reel via its own `/embed` iframe — no
 * SDK, no embed.js, no data collection wiring on our side (matches this
 * project's "no new vendor" default, docs/ARCHITECTURE.md §10-11: this
 * is a plain iframe, not an integration). Needs `frame-src
 * https://www.instagram.com` in next.config.ts's CSP, added alongside
 * the first real use of this component (docs/ATTRIBUTION.md/
 * ASSETS_AND_BRAND.md, "Videos").
 *
 * Takes the real post/reel URL a person would share (with or without a
 * trailing query string) — never invent a shortcode.
 */
export function InstagramEmbed({ url, title }: { url: string; title: string }) {
  const embedSrc = `${url.split("?")[0].replace(/\/$/, "")}/embed`;

  return (
    <div className="mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden border border-steel-dim/40 bg-ink-raised">
      <iframe
        src={embedSrc}
        title={title}
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
