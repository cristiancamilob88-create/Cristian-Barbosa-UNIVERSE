import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { requireAnalyticsAuth } from "./auth";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";

const TOKEN = "test-analytics-token-not-a-real-secret-value";
const SESSION_SECRET = "d".repeat(32);

function makeRequest({ bearer, sessionToken }: { bearer?: string; sessionToken?: string } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (sessionToken) headers.cookie = `${ADMIN_SESSION_COOKIE}=${sessionToken}`;
  return new NextRequest("https://cristianbarbosa.test/api/analytics/overview?range=30d", { headers });
}

describe("requireAnalyticsAuth", () => {
  const original = {
    DATABASE_URL: process.env.DATABASE_URL,
    ANALYTICS_API_TOKEN: process.env.ANALYTICS_API_TOKEN,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  beforeAll(() => {
    process.env.DATABASE_URL = "postgres://test-only";
  });

  afterAll(() => {
    // See loginFlow.test.ts's afterAll for why plain assignment is unsafe
    // when the original value was undefined.
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(() => {
    delete process.env.ANALYTICS_API_TOKEN;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("fails closed (503) when neither credential is configured", () => {
    const denied = requireAnalyticsAuth(makeRequest());
    expect(denied?.status).toBe(503);
  });

  it("rejects (401) a request with no credentials once a token is configured", () => {
    process.env.ANALYTICS_API_TOKEN = TOKEN;
    const denied = requireAnalyticsAuth(makeRequest());
    expect(denied?.status).toBe(401);
  });

  it("accepts a valid bearer token", () => {
    process.env.ANALYTICS_API_TOKEN = TOKEN;
    const denied = requireAnalyticsAuth(makeRequest({ bearer: TOKEN }));
    expect(denied).toBeNull();
  });

  it("rejects the wrong bearer token", () => {
    process.env.ANALYTICS_API_TOKEN = TOKEN;
    const denied = requireAnalyticsAuth(makeRequest({ bearer: "wrong-token" }));
    expect(denied?.status).toBe(401);
  });

  it("accepts a valid admin session cookie — the dashboard's own path, no bearer token involved", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const token = createSessionToken(SESSION_SECRET);
    const denied = requireAnalyticsAuth(makeRequest({ sessionToken: token }));
    expect(denied).toBeNull();
  });

  it("falls back to the bearer token when the session cookie is invalid/expired", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    process.env.ANALYTICS_API_TOKEN = TOKEN;
    const staleToken = createSessionToken(SESSION_SECRET, Date.now() - 24 * 60 * 60 * 1000);
    const denied = requireAnalyticsAuth(makeRequest({ sessionToken: staleToken, bearer: TOKEN }));
    expect(denied).toBeNull();
  });

  it("rejects a session cookie signed with a different secret", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const foreignToken = createSessionToken("e".repeat(32));
    const denied = requireAnalyticsAuth(makeRequest({ sessionToken: foreignToken }));
    expect(denied?.status).toBe(401);
  });
});
