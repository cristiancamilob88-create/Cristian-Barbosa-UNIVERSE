import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getQrDestination } from "@/server/admin/qr";
import { buildQrDestinationUrl } from "@/server/admin/qrImage";
import { renderQrStickerSheet } from "@/server/admin/qrStickerSheet";
import { env } from "@/lib/env";

/**
 * Same data/auth as `/api/admin/qr/[slug]/image` and `.../card`, a
 * third render — a printable sheet of 12 small, identical QR stickers
 * (`qrStickerSheet.ts`) instead of one large flyer. Cristian's own ask
 * (2026-09-04): stickers to cut with scissors and hand out/place
 * around a live event.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const { slug } = await params;
  const destination = await getQrDestination(getPool(), slug);
  if (!destination) {
    return NextResponse.json({ ok: false, error: "No existe un QR con ese slug." }, { status: 404 });
  }

  const url = buildQrDestinationUrl(env.NEXT_PUBLIC_SITE_URL, destination);
  const png = await renderQrStickerSheet(url);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-stickers-${destination.slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
