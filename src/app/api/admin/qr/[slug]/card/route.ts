import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getQrDestination } from "@/server/admin/qr";
import { buildQrDestinationUrl } from "@/server/admin/qrImage";
import { renderQrCard } from "@/server/admin/qrCard";
import { env } from "@/lib/env";

/**
 * Same data/auth as `/api/admin/qr/[slug]/image`, different render —
 * the branded, print-ready card (logo + QR on the site's ink
 * background) instead of a bare QR. See `qrCard.ts`'s doc comment for
 * why this stays image-only, no dynamic text.
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
  const png = await renderQrCard(url);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-card-${destination.slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
