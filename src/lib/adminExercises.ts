/**
 * Client-side contract for `/api/admin/exercises/*` (/admin/biblioteca).
 */
import type { Exercise, ExerciseInput } from "./exercises";

export class AdminExercisesApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminExercisesApiError";
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  let body: { ok?: boolean; error?: string; data?: T } = {};
  try {
    body = await res.json();
  } catch {
    // fall through
  }
  if (!res.ok || body.ok !== true) {
    throw new AdminExercisesApiError(res.status, body.error ?? `La solicitud falló (${res.status}).`);
  }
  return body.data as T;
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export function fetchExerciseLibrary(): Promise<{
  exercises: Exercise[];
  uploadEnabled: boolean;
  /** Bytes used in the video bucket; null when it can't be read. */
  storageUsedBytes: number | null;
}> {
  return request("/api/admin/exercises");
}

export function createExerciseEntry(input: ExerciseInput): Promise<Exercise> {
  return request("/api/admin/exercises", json("POST", input));
}

export function updateExerciseEntry(id: string, input: ExerciseInput): Promise<Exercise> {
  return request(`/api/admin/exercises/${id}`, json("PATCH", input));
}

export function removeExerciseVideo(id: string): Promise<Exercise> {
  return request(`/api/admin/exercises/${id}/video`, { method: "DELETE" });
}

/**
 * Uploads a video file for an exercise: asks our API for a signed URL,
 * sends the file straight to Supabase Storage (same request shape as
 * Supabase's own uploadToSignedUrl), then attaches it to the exercise.
 */
export async function uploadExerciseVideo(id: string, file: File): Promise<Exercise> {
  const { uploadUrl, path } = await request<{ uploadUrl: string; path: string }>(
    `/api/admin/exercises/${id}/video`,
    json("POST", { contentType: file.type, size: file.size }),
  );

  const form = new FormData();
  form.append("cacheControl", "31536000");
  form.append("", file);
  const upload = await fetch(uploadUrl, { method: "PUT", body: form, headers: { "x-upsert": "false" } }).catch(() => null);
  if (!upload || !upload.ok) {
    throw new AdminExercisesApiError(upload?.status ?? 0, "No se pudo subir el video. Revisa tu conexión e intenta de nuevo.");
  }

  return request(`/api/admin/exercises/${id}/video`, json("PUT", { path }));
}
