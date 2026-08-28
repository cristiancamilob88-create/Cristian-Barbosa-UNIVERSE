import "server-only";
import { after } from "next/server";

/**
 * Runs `task` after the response has already been sent, using Next's
 * `after()` (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md)
 * instead of a bare `void someAsyncFn()`.
 *
 * The bug this fixes (found 2026-08-28, Cristian's own real test — a
 * registration saved fine but the welcome email never arrived, and
 * Vercel's logs showed nothing at all, not even our own console.warn):
 * on a serverless platform, the function's execution can be frozen the
 * moment the response is returned. A bare fire-and-forget call
 * (`void sendWelcomeEmail(...)`) races that freeze — sometimes it
 * finishes in time, sometimes the platform cuts it off mid-flight
 * before it ever reaches a `console.warn`/`console.error`, which is
 * exactly the "nothing in the logs at all" symptom Cristian saw.
 * `after()` uses Vercel's `waitUntil` under the hood to keep the
 * function alive until the task actually settles — this is Next's own
 * documented fix for this exact scenario, not a home-grown workaround.
 *
 * `after()` throws synchronously outside a real request scope. This
 * project's route-handler integration tests call `POST()`/`GET()`
 * directly (never through Next's actual dev/prod server — see
 * src/app/api/lead/route.integration.test.ts), so there is no request
 * scope for `after()` to attach to there. Falling back to the old
 * bare fire-and-forget call in that case keeps those tests working
 * exactly as before; it's only ever reached in tests; a real request
 * always has a request scope and never hits the catch branch.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    void task();
  }
}
