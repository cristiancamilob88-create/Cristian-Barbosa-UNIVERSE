import "server-only";
import crypto from "node:crypto";
import { getServerEnv } from "@/server/env";

/**
 * Exercise-library videos in Supabase Storage (bucket `exercise-videos`,
 * migration 0019) — plain REST against Supabase's Storage API, no SDK,
 * same "no vendor SDK" convention as Mercado Pago and WhatsApp here.
 *
 * Upload flow: the admin's browser asks /api/admin/exercises/[id]/video
 * for a signed upload URL (minted here with the service-role key, which
 * never leaves the server), PUTs the file straight to Supabase — a phone
 * video is far bigger than a Vercel function accepts as a body — then
 * tells the API to attach the stored path to the exercise.
 *
 * Reading is a public bucket URL: these are demo clips of a movement.
 */

export const EXERCISE_VIDEO_BUCKET = "exercise-videos";
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
/** Same cap as the bucket's own file_size_limit (migration 0019). */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const EXTENSION: Record<(typeof ALLOWED_VIDEO_TYPES)[number], string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

function storageConfig(): { baseUrl: string; key: string } | null {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return { baseUrl: SUPABASE_URL.replace(/\/+$/, ""), key: SUPABASE_SERVICE_ROLE_KEY };
}

/** Whether uploads are configured — the admin form hides the upload button otherwise. */
export function isVideoUploadConfigured(): boolean {
  return storageConfig() !== null;
}

/** A fresh, unguessable object path per upload, so a replaced video never serves a stale cached copy. */
export function newVideoPath(exerciseId: string, contentType: (typeof ALLOWED_VIDEO_TYPES)[number]): string {
  return `${exerciseId}/${crypto.randomUUID()}.${EXTENSION[contentType]}`;
}

/** Only paths this module minted for this exercise are accepted back (no pointing an exercise at someone else's object). */
export function isOwnVideoPath(exerciseId: string, path: string): boolean {
  return new RegExp(`^${exerciseId}/[0-9a-f-]{36}\\.(mp4|mov|webm)$`).test(path);
}

/** Public URL for a stored video, or null when storage isn't configured. */
export function publicVideoUrl(path: string | null): string | null {
  const config = storageConfig();
  if (!config || !path) return null;
  return `${config.baseUrl}/storage/v1/object/public/${EXERCISE_VIDEO_BUCKET}/${path}`;
}

/**
 * A signed URL the browser can PUT the file to directly (valid 2h, per
 * Supabase's docs). Throws on a Storage API error so the route can say so.
 */
export async function createSignedVideoUpload(path: string): Promise<string> {
  const config = storageConfig();
  if (!config) throw new Error("Supabase Storage is not configured");

  const res = await fetch(`${config.baseUrl}/storage/v1/object/upload/sign/${EXERCISE_VIDEO_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(`Storage sign failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as { url?: string };
  if (!body.url) throw new Error("Storage sign returned no url");
  // body.url is relative to /storage/v1 and already carries ?token=…
  return `${config.baseUrl}/storage/v1${body.url}`;
}

/** Best-effort removal of a replaced/removed video; a failure only leaves an orphan file, never breaks the save. */
export async function deleteVideo(path: string): Promise<void> {
  const config = storageConfig();
  if (!config) return;
  try {
    await fetch(`${config.baseUrl}/storage/v1/object/${EXERCISE_VIDEO_BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${config.key}`, apikey: config.key, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [path] }),
    });
  } catch (err) {
    console.error("[exercise-videos] failed to delete old video", err);
  }
}
