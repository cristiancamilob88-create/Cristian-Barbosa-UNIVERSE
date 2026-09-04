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
 * docs/ATTRIBUTION.md).
 */
export async function renderQrPng(destinationUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(destinationUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 1200,
    margin: 3,
  });
}
