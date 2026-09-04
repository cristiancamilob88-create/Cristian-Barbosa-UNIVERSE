import "server-only";
import path from "node:path";
import sharp from "sharp";
import { renderQrPng } from "./qrImage";

/**
 * Composites a printable "branded card" — logo on top, QR below, on
 * the site's own ink background — instead of a bare QR. Cristian's own
 * ask (2026-08-28): "primero revisa el loguito y abajo el QR, pues te
 * queda bonita la imagen cuando vayan a abrirla."
 *
 * Deliberately no dynamically-rendered text (no caption, no campaign
 * name): sharp's SVG text rendering depends on fonts being available
 * to librsvg wherever this runs, and that's unverified for Vercel's
 * serverless environment — a real risk, not a hypothetical one (this
 * app already hit a font-availability warning once, see the Turbopack
 * build's "Big Shoulders" warning). `public/brand/cristian-logo-01.png`
 * already has "Cristian Barbosa — La Piedra Preciosa" baked into its
 * pixels, so the card carries full branding without rendering a single
 * glyph — only pre-rendered images and plain SVG shapes (a blur mask, a
 * solid rectangle), which have no font dependency at all.
 */

const CANVAS_W = 1200;
const LOGO_W = 900;
const QR_SIZE = 820;
const TOP_MARGIN = 80;
const GAP = 50;
const DIVIDER_H = 4;
const DIVIDER_W = 160;
const BOTTOM_MARGIN = 100;
const INK = "#0b0d0c";
const EMBER = "#f2241a";

const LOGO_PATH = path.join(process.cwd(), "public/brand/cristian-logo-01.png");

/** Soft-edged alpha mask (a blurred rounded rect) so the logo fades into the ink background instead of showing a hard rectangle seam. */
async function softEdgeMask(width: number, height: number): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur stdDeviation="28"/>
         </filter>
       </defs>
       <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="#fff" filter="url(#f)"/>
     </svg>`,
  );
  return sharp(svg).png().toBuffer();
}

export async function renderQrCard(destinationUrl: string): Promise<Buffer> {
  const logoResized = await sharp(LOGO_PATH).resize({ width: LOGO_W }).toBuffer();
  const { height: logoH } = await sharp(logoResized).metadata();
  const resolvedLogoH = logoH ?? Math.round(LOGO_W / 1.5);

  const [mask, qrBuf] = await Promise.all([
    softEdgeMask(LOGO_W, resolvedLogoH),
    renderQrPng(destinationUrl, QR_SIZE),
  ]);
  const softLogo = await sharp(logoResized)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const dividerY = TOP_MARGIN + resolvedLogoH + GAP;
  const qrY = dividerY + DIVIDER_H + GAP;
  const canvasH = qrY + QR_SIZE + BOTTOM_MARGIN;

  const dividerSvg = Buffer.from(
    `<svg width="${DIVIDER_W}" height="${DIVIDER_H}"><rect width="100%" height="100%" fill="${EMBER}"/></svg>`,
  );

  return sharp({ create: { width: CANVAS_W, height: canvasH, channels: 3, background: INK } })
    .composite([
      { input: softLogo, left: Math.round((CANVAS_W - LOGO_W) / 2), top: TOP_MARGIN },
      { input: dividerSvg, left: Math.round((CANVAS_W - DIVIDER_W) / 2), top: dividerY },
      { input: qrBuf, left: Math.round((CANVAS_W - QR_SIZE) / 2), top: qrY },
    ])
    .png()
    .toBuffer();
}
