import { z } from "zod";

/**
 * Exercise library rules (migration 0019, docs/TRAINING.md "Exercise
 * library") — pure and client-safe: the groups, the input schema both the
 * admin form and its API validate against, and how a video link turns
 * into something playable inside the app.
 */

export const MUSCLE_GROUPS = [
  "pecho",
  "espalda",
  "abdomen",
  "triceps",
  "pierna",
  "cuerpo_completo",
  "skills",
  "movilidad",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Cristian's own groups (2026-09-30), plus mobility/stretching, which the beginner routine already uses. */
export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  abdomen: "Abdomen",
  triceps: "Tríceps",
  pierna: "Pierna",
  cuerpo_completo: "Cuerpo completo",
  skills: "Skills",
  movilidad: "Movilidad y estiramiento",
};

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string | null;
  commonMistakes: string | null;
  progression: string | null;
  videoUrl: string | null;
  /** Public URL of the uploaded video, resolved server-side; null when none was uploaded. */
  uploadedVideoUrl: string | null;
  active: boolean;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  description: optionalText(2000),
  commonMistakes: optionalText(1000),
  progression: optionalText(120),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https:\/\//.test(v), "El link del video debe empezar con https://")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  active: z.boolean().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

/**
 * The YouTube video id in a link Cristian pastes — watch, youtu.be,
 * shorts or embed form. Null for anything that isn't YouTube (an
 * Instagram reel, say), which the student page shows as a plain link
 * instead of an embedded player.
 */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = parsed.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else {
      const match = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      id = match?.[1] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

/** Privacy-enhanced embed URL (no tracking cookies until the student presses play). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

/** Case/accent-insensitive search key, so "triceps" finds "Tríceps". */
export function searchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
