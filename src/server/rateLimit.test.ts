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
