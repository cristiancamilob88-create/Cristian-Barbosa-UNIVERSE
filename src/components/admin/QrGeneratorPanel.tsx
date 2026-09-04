"use client";

import { useState } from "react";

/**
 * "Generate a printable QR" action for /admin/qr — Cristian's own ask
 * (2026-08-28) after two QR images (colegio-la-leticia-2026,
 * concordia-2026) were generated ad hoc outside the app each time, per
 * docs/ATTRIBUTION.md's own note that this was worth promoting to a
 * real admin action once it kept happening. The branded card
 * (`/card` — logo + QR on the ink background, `src/server/admin/
 * qrCard.ts`) was added the same day as a second option, after
 * Cristian asked for something nicer than the bare code to look at
 * when someone opens the image ("te queda bonita la imagen").
 *
 * Deliberately a plain slug text field, not a dropdown fetched from
 * `/api/analytics/qr` — every registered slug is already visible as
 * the first column of the performance table right below this panel,
 * and this is a single-user internal tool where that lookup cost is
 * fine. The image itself is fetched by the browser (`<img>`/`<a>` src),
 * not via `fetch()`+blob — each endpoint sets its own `Content-Type`/
 * `Content-Disposition` and the httpOnly admin session cookie rides
 * along automatically on a same-origin request either way.
 */
export function QrGeneratorPanel() {
  const [slugInput, setSlugInput] = useState("");
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const encodedSlug = generatedSlug ? encodeURIComponent(generatedSlug) : null;
  const cardUrl = encodedSlug ? `/api/admin/qr/${encodedSlug}/card` : null;
  const imageUrl = encodedSlug ? `/api/admin/qr/${encodedSlug}/image` : null;

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugInput.trim().toLowerCase();
    if (!slug) return;
    setImgError(false);
    setGeneratedSlug(slug);
  }

  return (
    <div className="mb-8 flex flex-col gap-4 rounded border border-steel-dim/40 bg-ink-raised p-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Generar</p>
        <h2 className="mt-1 font-display text-lg font-black uppercase tracking-tight text-chalk">
          QR para imprimir
        </h2>
        <p className="mt-1 text-sm text-steel">
          Escribe el slug de un QR ya registrado (columna &quot;QR&quot; en la tabla de abajo) — genera la
          imagen con la URL real de producción y el seguimiento correcto ya incluido.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-steel">Slug del QR</span>
          <input
            type="text"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="concordia-2026"
            className="rounded border border-steel-dim/60 bg-ink px-4 py-2.5 text-sm text-chalk outline-none focus:border-ember"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-ember px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust"
        >
          Generar
        </button>
      </form>

      {cardUrl && !imgError && (
        <div className="flex flex-wrap items-start gap-6 border-t border-steel-dim/40 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- an
              authenticated admin API route, not a next/image-eligible
              static/remote asset */}
          <img
            src={cardUrl}
            alt={`Tarjeta con QR para ${generatedSlug}`}
            onError={() => setImgError(true)}
            className="h-72 w-auto border border-steel-dim/40 bg-ink"
          />
          <div className="flex flex-col gap-3">
            <a
              href={cardUrl}
              className="inline-flex w-fit items-center border border-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ember transition-colors hover:bg-ember hover:text-ink"
            >
              Descargar tarjeta (con logo)
            </a>
            <a
              href={imageUrl!}
              className="inline-flex w-fit items-center border border-chalk px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-ink"
            >
              Descargar solo el QR
            </a>
          </div>
        </div>
      )}

      {cardUrl && imgError && (
        <p role="alert" className="border-t border-steel-dim/40 pt-4 text-sm text-rust">
          No existe un QR registrado con el slug &quot;{generatedSlug}&quot;.
        </p>
      )}
    </div>
  );
}
