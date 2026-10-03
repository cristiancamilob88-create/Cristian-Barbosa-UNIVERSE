import "server-only";
import type { Exercise } from "@/lib/exercises";
import type { ExerciseRow } from "@/server/db/repositories/exercise";
import { publicVideoUrl } from "@/server/storage/exerciseVideos";

/** Row → what pages and the admin API send out: the stored path becomes a playable public URL. */
export function toPublicExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    description: row.description,
    commonMistakes: row.commonMistakes,
    progression: row.progression,
    videoUrl: row.videoUrl,
    uploadedVideoUrl: publicVideoUrl(row.videoPath),
    active: row.active,
  };
}
