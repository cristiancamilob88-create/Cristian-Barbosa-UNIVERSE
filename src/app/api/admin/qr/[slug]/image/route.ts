import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getQrDestination } from "@/server/admin/qr";
import { buildQrDestinationUrl, renderQrPng } from "@/server/admin/qrImage";
import { env } from "@/lib/env";

/**
 * Generates a printable QR PNG for any registered `qr_source` slug —
 * the "generate" action docs/ATTRIBUTION.md flagged as worth adding
 * once ad hoc, one-off QR images (colegio-la-leticia-2026,
 * concordia-2026) kept happening per-event. Session-only auth, same
 * posture as `/api/admin/contacts` (`requireAdminApiSession`, no
 * bearer-token fallback) — this is an admin action, not a read a future
 * automation caller should reach with `ANALYTICS_API_TOKEN`.
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
  const png = await renderQrPng(url);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${destination.slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
