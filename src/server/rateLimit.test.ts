import { describe, it, expect, vi, afterEach } from "vitest";
import { createRateLimiter, getRequestIp } from "./rateLimit";

describe("createRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then rejects the next one", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(true);
  });

  it("tracks each key independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("b")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(true);
    expect(limiter.isRateLimited("b")).toBe(true);
  });

  it("forgets requests once they age out of the window", () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(limiter.isRateLimited("a")).toBe(false);
  });

  it("reset() clears all recorded activity", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(true);
    limiter.reset();
    expect(limiter.isRateLimited("a")).toBe(false);
  });
});

describe("getRequestIp", () => {
  it("reads the first entry of a comma-separated x-forwarded-for", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getRequestIp(request)).toBe("1.2.3.4");
  });

  it("falls back to 'unknown' when the header is absent", () => {
    const request = new Request("https://example.test");
    expect(getRequestIp(request)).toBe("unknown");
  });
});

describe("createVisitorRateLimiter", () => {
  const req = (ip: string, visitor?: string) => {
    const headers = new Headers({ "x-forwarded-for": ip });
    return { headers, cookies: { get: (name: string) => (name === "cb_visitor" && visitor ? { value: visitor } : undefined) } };
  };

  it("lets many visitors share one carrier IP (viral spike) without blocking them", async () => {
    const { createVisitorRateLimiter } = await import("./rateLimit");
    const limiter = createVisitorRateLimiter({ windowMs: 60_000, perVisitor: 2, perIp: 100 });
    for (let i = 0; i < 50; i++) {
      expect(limiter.isRateLimited(req("181.1.1.1", `visitor-${i}`), "cb_visitor")).toBe(false);
    }
  });

  it("still caps one visitor, the IP as a whole, and cookieless scripts", async () => {
    const { createVisitorRateLimiter } = await import("./rateLimit");
    const limiter = createVisitorRateLimiter({ windowMs: 60_000, perVisitor: 2, perIp: 3 });
    expect(limiter.isRateLimited(req("1.1.1.1", "a"), "cb_visitor")).toBe(false);
    expect(limiter.isRateLimited(req("1.1.1.1", "a"), "cb_visitor")).toBe(false);
    expect(limiter.isRateLimited(req("1.1.1.1", "a"), "cb_visitor")).toBe(true); // visitor cap
    expect(limiter.isRateLimited(req("1.1.1.1", "b"), "cb_visitor")).toBe(true); // IP ceiling (4th from this IP)
    expect(limiter.isRateLimited(req("2.2.2.2"), "cb_visitor")).toBe(false);
    expect(limiter.isRateLimited(req("2.2.2.2"), "cb_visitor")).toBe(false);
    expect(limiter.isRateLimited(req("2.2.2.2"), "cb_visitor")).toBe(true); // no cookie → per-visitor cap on the IP
  });
});
