import type { Metadata } from "next";
import { getPool } from "@/server/db/pool";
import { listExercises } from "@/server/db/repositories/exercise";
import { toPublicExercise } from "@/server/training/exercises";
import { LibraryBrowser } from "./LibraryBrowser";

export const metadata: Metadata = { title: "Biblioteca" };

/**
 * The exercise library, student side (docs/TRAINING.md): every active
 * exercise by group, searchable, each opening its how-to + video. The
 * (app) layout already checked the session and an active plan.
 */
export default async function MemberLibraryPage() {
  const exercises = (await listExercises(getPool(), { activeOnly: true })).map(toPublicExercise);

  if (exercises.length === 0) {
    return (
      <p className="border border-dashed border-steel-dim/50 p-6 text-center text-steel">
        Cristian está preparando la biblioteca de ejercicios. Muy pronto vas a encontrar aquí cómo se hace cada uno.
      </p>
    );
  }
  return <LibraryBrowser exercises={exercises} />;
}
