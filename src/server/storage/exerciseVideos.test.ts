import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSignedVideoUpload,
  isOwnVideoPath,
  isVideoUploadConfigured,
  newVideoPath,
  publicVideoUrl,
} from "./exerciseVideos";

const EXERCISE = "0b7f7a44-1c1e-4d8c-9d3e-3f1a2b3c4d5e";
const original = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };

function restore() {
  if (original.url === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = original.url;
  if (original.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = original.key;
}

describe("exercise videos — unconfigured", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
  afterEach(restore);

  it("reports uploads as off and resolves no public URL", () => {
    expect(isVideoUploadConfigured()).toBe(false);
    expect(publicVideoUrl(`${EXERCISE}/x.mp4`)).toBeNull();
  });
});

describe("exercise videos — configured", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://abc.supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests-only";
  });
  afterEach(() => {
    restore();
    vi.unstubAllGlobals();
  });

  it("mints a fresh path per upload, scoped to the exercise", () => {
    const a = newVideoPath(EXERCISE, "video/mp4");
    const b = newVideoPath(EXERCISE, "video/quicktime");
    expect(a).not.toBe(b);
    expect(isOwnVideoPath(EXERCISE, a)).toBe(true);
    expect(b.endsWith(".mov")).toBe(true);
  });

  it("accepts back only a path minted for that same exercise", () => {
    const path = newVideoPath(EXERCISE, "video/webm");
    expect(isOwnVideoPath("11111111-1111-1111-1111-111111111111", path)).toBe(false);
    expect(isOwnVideoPath(EXERCISE, `${EXERCISE}/../other/x.mp4`)).toBe(false);
    expect(isOwnVideoPath(EXERCISE, "someone-else/file.mp4")).toBe(false);
  });

  it("builds the public bucket URL", () => {
    expect(publicVideoUrl(`${EXERCISE}/v.mp4`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/exercise-videos/${EXERCISE}/v.mp4`,
    );
  });

  it("asks Supabase for a signed upload URL with the service key, and returns it absolute", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: `/object/upload/sign/exercise-videos/${EXERCISE}/v.mp4?token=t0k` }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const url = await createSignedVideoUpload(`${EXERCISE}/v.mp4`);
    expect(url).toBe(`https://abc.supabase.co/storage/v1/object/upload/sign/exercise-videos/${EXERCISE}/v.mp4?token=t0k`);
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(`https://abc.supabase.co/storage/v1/object/upload/sign/exercise-videos/${EXERCISE}/v.mp4`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer service-role-key-for-tests-only");
  });

  it("throws when Supabase refuses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 400 })));
    await expect(createSignedVideoUpload(`${EXERCISE}/v.mp4`)).rejects.toThrow(/400/);
  });
});
