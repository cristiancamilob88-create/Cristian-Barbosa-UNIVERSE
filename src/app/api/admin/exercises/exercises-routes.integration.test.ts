import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeTestPool, getTestPool } from "@/server/db/testHelpers.integration";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";
import { GET as list, POST as create } from "./route";
import { PATCH as patch } from "./[id]/route";
import { DELETE as removeVideo, POST as signVideo, PUT as attachVideo } from "./[id]/video/route";

const ADMIN_SECRET = "admin-test-secret-" + "e".repeat(20);

function req(path: string, init: { method?: string; body?: unknown; admin?: boolean } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.admin !== false) headers.cookie = `${ADMIN_SESSION_COOKIE}=${createSessionToken(ADMIN_SECRET)}`;
  return new NextRequest(`https://cristianbarbosa.test${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const original = {
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

beforeEach(async () => {
  await getTestPool().query("truncate table exercise");
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
afterAll(closeTestPool);

async function makeExercise(name = "Fondos en paralelas") {
  const res = await create(
    req("/api/admin/exercises", {
      method: "POST",
      body: { name, muscleGroup: "triceps", description: "Baja hasta 90°\nSube sin bloquear", videoUrl: "https://youtu.be/dQw4w9WgXcQ" },
    }),
  );
  return (await res.json()).data;
}

describe("/api/admin/exercises", () => {
  it("requires the admin session", async () => {
    expect((await list(req("/api/admin/exercises", { admin: false }))).status).toBe(401);
    expect((await create(req("/api/admin/exercises", { method: "POST", admin: false, body: {} }))).status).toBe(401);
  });

  it("creates and lists an exercise, reporting upload as not configured", async () => {
    const created = await makeExercise();
    expect(created).toMatchObject({ name: "Fondos en paralelas", muscleGroup: "triceps", uploadedVideoUrl: null, active: true });

    const { data } = await (await list(req("/api/admin/exercises"))).json();
    expect(data.uploadEnabled).toBe(false);
    expect(data.exercises).toHaveLength(1);
  });

  it("refuses a duplicate name regardless of case (409)", async () => {
    await makeExercise();
    const res = await create(req("/api/admin/exercises", { method: "POST", body: { name: "FONDOS EN PARALELAS", muscleGroup: "pecho" } }));
    expect(res.status).toBe(409);
  });

  it("rejects a non-https video link", async () => {
    const res = await create(
      req("/api/admin/exercises", { method: "POST", body: { name: "X", muscleGroup: "pecho", videoUrl: "javascript:alert(1)" } }),
    );
    expect(res.status).toBe(400);
  });

  it("edits an exercise and can hide it from students", async () => {
    const created = await makeExercise();
    const res = await patch(
      req(`/api/admin/exercises/${created.id}`, {
        method: "PATCH",
        body: { name: "Fondos en paralelas", muscleGroup: "pecho", active: false, commonMistakes: "Hombros arriba" },
      }),
      ctx(created.id),
    );
    expect((await res.json()).data).toMatchObject({ muscleGroup: "pecho", active: false, commonMistakes: "Hombros arriba" });
  });
});

describe("/api/admin/exercises/[id]/video", () => {
  it("answers 503 while Supabase Storage isn't configured", async () => {
    const created = await makeExercise();
    const res = await signVideo(
      req(`/api/admin/exercises/${created.id}/video`, { method: "POST", body: { contentType: "video/mp4", size: 1000 } }),
      ctx(created.id),
    );
    expect(res.status).toBe(503);
  });

  describe("with storage configured", () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = "https://abc.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests-only";
    });

    it("signs an upload, then attaches only a path minted for this exercise", async () => {
      const created = await makeExercise();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          new Response(JSON.stringify({ url: `${new URL(url).pathname.replace("/storage/v1", "")}?token=t` }), { status: 200 }),
        ),
      );

      const signed = await (
        await signVideo(
          req(`/api/admin/exercises/${created.id}/video`, { method: "POST", body: { contentType: "video/mp4", size: 5_000_000 } }),
          ctx(created.id),
        )
      ).json();
      expect(signed.data.uploadUrl).toMatch(/^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/upload\/sign\/exercise-videos\//);

      const foreign = await attachVideo(
        req(`/api/admin/exercises/${created.id}/video`, { method: "PUT", body: { path: "other/evil.mp4" } }),
        ctx(created.id),
      );
      expect(foreign.status).toBe(400);

      const attached = await (
        await attachVideo(
          req(`/api/admin/exercises/${created.id}/video`, { method: "PUT", body: { path: signed.data.path } }),
          ctx(created.id),
        )
      ).json();
      expect(attached.data.uploadedVideoUrl).toBe(
        `https://abc.supabase.co/storage/v1/object/public/exercise-videos/${signed.data.path}`,
      );

      const removed = await (
        await removeVideo(req(`/api/admin/exercises/${created.id}/video`, { method: "DELETE" }), ctx(created.id))
      ).json();
      expect(removed.data.uploadedVideoUrl).toBeNull();
    });

    it("refuses a file type or size the bucket won't take", async () => {
      const created = await makeExercise();
      const wrongType = await signVideo(
        req(`/api/admin/exercises/${created.id}/video`, { method: "POST", body: { contentType: "image/png", size: 10 } }),
        ctx(created.id),
      );
      expect(wrongType.status).toBe(400);
      const tooBig = await signVideo(
        req(`/api/admin/exercises/${created.id}/video`, { method: "POST", body: { contentType: "video/mp4", size: 60 * 1024 * 1024 } }),
        ctx(created.id),
      );
      expect(tooBig.status).toBe(400);
    });
  });
});
