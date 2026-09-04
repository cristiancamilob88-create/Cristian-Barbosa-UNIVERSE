import "server-only";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { renderQrPng } from "./qrImage";

/**
 * A printable sheet of small, identical QR stickers — Cristian's own
 * ask (2026-09-04, the Concordia night-event strategy): cut individual
 * stickers out with scissors to hand out and place around the venue,
 * instead of one big flyer. Twelve tiles per Letter-size (8.5x11in)
 * page at 300 DPI, laid out with gaps a scissors cut fits into.
 *
 * Design choices, deliberate:
 *  - White page background, not the ink background `qrCard.ts` uses —
 *    printing 12 solid-dark tiles per sheet burns through toner/ink
 *    fast when he's printing several sheets for a live event; a thin
 *    ember border reads as branded without covering the tile in ink.
 *  - QR tile size (~1.4in / 430px after the logo) is deliberately not
 *    shrunk further to fit more per page — a QR this dense (a full
 *    URL with UTM params, high error correction) needs real size to
 *    scan reliably from arm's length under a show's dim lighting;
 *    fitting more, smaller tiles on the sheet would look nice and
 *    scan badly. If more per sheet is wanted later, drop error
 *    correction or shorten the encoded URL first, not just the print
 *    size.
 *  - No dynamically-rendered text, same reasoning as `qrCard.ts`
 *    (sharp's SVG text needs fonts unverified for Vercel's serverless
 *    environment) — the logo mark carries the branding, a plain
 *    border square and dashed cut-guides are pure geometry, no font
 *    dependency.
 */

const DPI = 300;
const PAGE_W = 8.5 * DPI; // 2550 — US Letter, the common size for printers in Colombia
const PAGE_H = 11 * DPI; // 3300

const TILE = 660; // 2.2in per sticker, before cutting
const GAP = 60; // 0.2in between tiles — cutting room
const COLS = 3;
const ROWS = 4;

const TILE_PADDING = 30;
const LOGO_SIZE = 150;
const LOGO_TO_QR_GAP = 20;
const QR_SIZE = TILE - TILE_PADDING * 2 - LOGO_SIZE - LOGO_TO_QR_GAP; // 430
const BORDER_WIDTH = 4;

const EMBER = "#f2241a";
const CUT_LINE = "#cccccc";

const LOGO_PATH = path.join(process.cwd(), "src/app/icon.png");

async function buildTile(destinationUrl: string): Promise<Buffer> {
  const [logo, qr] = await Promise.all([
    sharp(LOGO_PATH).resize({ width: LOGO_SIZE }).toBuffer(),
    renderQrPng(destinationUrl, QR_SIZE),
  ]);

  const borderSvg = Buffer.from(
    `<svg width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">
       <rect x="${BORDER_WIDTH / 2}" y="${BORDER_WIDTH / 2}" width="${TILE - BORDER_WIDTH}" height="${TILE - BORDER_WIDTH}"
             fill="none" stroke="${EMBER}" stroke-width="${BORDER_WIDTH}"/>
     </svg>`,
  );

  return sharp({ create: { width: TILE, height: TILE, channels: 3, background: "#ffffff" } })
    .composite([
      { input: borderSvg, left: 0, top: 0 },
      { input: logo, left: Math.round((TILE - LOGO_SIZE) / 2), top: TILE_PADDING },
      { input: qr, left: Math.round((TILE - QR_SIZE) / 2), top: TILE_PADDING + LOGO_SIZE + LOGO_TO_QR_GAP },
    ])
    .png()
    .toBuffer();
}

function cutGuideSvg(): Buffer {
  const gridW = COLS * TILE + (COLS - 1) * GAP;
  const gridH = ROWS * TILE + (ROWS - 1) * GAP;
  const marginX = Math.round((PAGE_W - gridW) / 2);
  const marginY = Math.round((PAGE_H - gridH) / 2);

  const lines: string[] = [];
  for (let col = 1; col < COLS; col++) {
    const x = marginX + col * TILE + (col - 0.5) * GAP;
    lines.push(`<line x1="${x}" y1="${marginY}" x2="${x}" y2="${marginY + gridH}" />`);
  }
  for (let row = 1; row < ROWS; row++) {
    const y = marginY + row * TILE + (row - 0.5) * GAP;
    lines.push(`<line x1="${marginX}" y1="${y}" x2="${marginX + gridW}" y2="${y}" />`);
  }

  return Buffer.from(
    `<svg width="${PAGE_W}" height="${PAGE_H}" xmlns="http://www.w3.org/2000/svg">
       <g stroke="${CUT_LINE}" stroke-width="2" stroke-dasharray="10,10">${lines.join("")}</g>
     </svg>`,
  );
}

export async function renderQrStickerSheet(destinationUrl: string): Promise<Buffer> {
  const gridW = COLS * TILE + (COLS - 1) * GAP;
  const gridH = ROWS * TILE + (ROWS - 1) * GAP;
  const marginX = Math.round((PAGE_W - gridW) / 2);
  const marginY = Math.round((PAGE_H - gridH) / 2);

  const [tile, cutGuide] = await Promise.all([buildTile(destinationUrl), sharp(cutGuideSvg()).png().toBuffer()]);

  const composites: OverlayOptions[] = [{ input: cutGuide, left: 0, top: 0 }];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      composites.push({
        input: tile,
        left: marginX + col * (TILE + GAP),
        top: marginY + row * (TILE + GAP),
      });
    }
  }

  return sharp({ create: { width: PAGE_W, height: PAGE_H, channels: 3, background: "#ffffff" } })
    .composite(composites)
    .png()
    .toBuffer();
}
