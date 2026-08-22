import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/**
 * Lead intake endpoint for the /contacto form.
 *
 * Foundation-stage scope: validates and rate-limits the request, then
 * returns success. It does NOT persist to a database or CRM yet — there
 * is no data store in this block (see docs/DATA_MODEL.md). Wiring this
 * to actually create a Contact/Lead row is the first task of the CRM
 * data layer block; the request/response contract here is designed to
 * stay stable when that lands.
 *
 * Security:
 * - All input is validated with zod; invalid input is rejected with 400
 *   and never reaches application logic.
 * - A simple in-memory sliding-window rate limit caps abuse per IP.
 *   Decision: in-memory is enough for a single-instance foundation
 *   deploy; it resets on redeploy and does not coordinate across
 *   instances. Replace with a shared store (e.g. Upstash Redis) before
 *   running more than one instance behind a load balancer.
 */

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  topic: z.enum(["entrenar", "coaching", "shows", "marcas", "musica", "productos", "general"]),
  message: z.string().trim().max(2000).optional().default(""),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional().default(""),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.company) {
    // Honeypot tripped — pretend success, drop silently.
    return NextResponse.json({ ok: true });
  }

  // TODO(CRM block): persist as Contact + Lead (src/types/crm.ts) instead of logging.
  console.info("[lead]", {
    name: parsed.data.name,
    topic: parsed.data.topic,
    hasMessage: parsed.data.message.length > 0,
  });

  return NextResponse.json({ ok: true });
}
