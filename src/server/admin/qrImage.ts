import "server-only";
import QRCode from "qrcode";
import type { QrDestination } from "./qr";

/**
 * Builds the real, attributed URL a printed QR should encode — the
 * same shape docs/ATTRIBUTION.md documents (`utm_medium=qr` +
 * `?qr=<qr_source.slug>`), generalized so any registered `qr_source`
 * row can generate one, not just the ones done ad hoc so far
 * (colegio-la-leticia-2026, concordia-2026). Only `utm_medium=qr` and
 * `qr=<slug>` are actually resolved into a `qr_source` row
 * (src/lib/attribution.ts); `utm_source`/`utm_campaign` are included
 * for readability in analytics, not required for resolution.
 *
 * Pure — no I/O — so it's unit-testable without a database.
 */
export function buildQrDestinationUrl(siteUrl: string, destination: QrDestination): string {
  const url = new URL(destination.destinationPath, siteUrl);
  url.searchParams.set("utm_source", "qr");
  url.searchParams.set("utm_medium", "qr");
  url.searchParams.set("utm_campaign", destination.slug);
  url.searchParams.set("qr", destination.slug);
  return url.toString();
}

/**
 * Renders a printable QR PNG for a destination URL. High error
 * correction ("H") and a generous margin — this is meant to survive
 * being printed small on a flyer or sticker, not just scanned on a
 * screen (same settings used for the earlier ad hoc QRs, see
 * docs/ATTRIBUTION.md). `width` is configurable so `qrCard.ts` can
 * render directly at its card layout's target size instead of
 * downscaling the standalone 1200px image (resizing would blur/
 * anti-alias the QR's square modules).
 */
export async function renderQrPng(destinationUrl: string, width = 1200): Promise<Buffer> {
  return QRCode.toBuffer(destinationUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    width,
    margin: 3,
  });
}
