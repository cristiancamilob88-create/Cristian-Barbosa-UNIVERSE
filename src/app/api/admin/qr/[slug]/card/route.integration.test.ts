import { NextRequest } from "next/server";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { closeTestPool } from "@/server/db/testHelpers.integration";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { GET } from "./route";

const TEST_SESSION_SECRET = "session-test-secret-" + "x".repeat(20);

function makeRequest(slug: string, sessionCookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (sessionCookie) headers.cookie = `${ADMIN_SESSION_COOKIE}=${sessionCookie}`;
  return new NextRequest(`https://cristianbarbosa.test/api/admin/qr/${slug}/card`, { headers });
}

describe("GET /api/admin/qr/[slug]/card", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
  });
  afterAll(closeTestPool);

  it("fails closed (503) when ADMIN_SESSION_SECRET isn't configured", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const response = await GET(makeRequest("colegio-la-leticia-2026"), {
      params: Promise.resolve({ slug: "colegio-la-leticia-2026" }),
    });
    expect(response.status).toBe(503);
  });

  it("rejects a request with no session cookie", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const response = await GET(makeRequest("colegio-la-leticia-2026"), {
      params: Promise.resolve({ slug: "colegio-la-leticia-2026" }),
    });
    expect(response.status).toBe(401);
  });

  it("404s for a slug with no matching qr_source row", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const token = createSessionToken(TEST_SESSION_SECRET);

    const response = await GET(makeRequest("does-not-exist", token), {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns a downloadable branded PNG for a real, logged-in-only request", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SESSION_SECRET;
    const token = createSessionToken(TEST_SESSION_SECRET);

    const response = await GET(makeRequest("colegio-la-leticia-2026", token), {
      params: Promise.resolve({ slug: "colegio-la-leticia-2026" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toContain("qr-card-colegio-la-leticia-2026.png");

    const buf = Buffer.from(await response.arrayBuffer());
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});
