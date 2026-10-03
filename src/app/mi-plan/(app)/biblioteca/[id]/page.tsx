import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPool } from "@/server/db/pool";
import { getExercise } from "@/server/db/repositories/exercise";
import { toPublicExercise } from "@/server/training/exercises";
import { ExerciseVideo } from "@/components/training/ExerciseVideo";
import { MUSCLE_GROUP_LABEL } from "@/lib/exercises";

export const metadata: Metadata = { title: "Ejercicio" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One exercise: Cristian's video, how it's done (one step per line) and the mistakes to avoid. */
export default async function MemberExercisePage(props: PageProps<"/mi-plan/biblioteca/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const row = await getExercise(getPool(), id);
  if (!row || !row.active) notFound();
  const exercise = toPublicExercise(row);

  const steps = exercise.description?.split("\n").map((s) => s.trim()).filter(Boolean) ?? [];
  const mistakes = exercise.commonMistakes?.split("\n").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <article className="flex flex-col gap-6">
      <Link href="/mi-plan/biblioteca" className="w-fit font-mono text-xs uppercase tracking-wider text-steel hover:text-chalk">
        ← Biblioteca
      </Link>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">{MUSCLE_GROUP_LABEL[exercise.muscleGroup]}</p>
        <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-chalk">{exercise.name}</h2>
        {exercise.progression && <p className="mt-1 text-sm text-steel">{exercise.progression}</p>}
      </header>

      <ExerciseVideo exercise={exercise} title={exercise.name} />

      {steps.length > 0 && (
        <section>
          <h3 className="font-mono text-xs uppercase tracking-widest text-steel">Cómo se hace</h3>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-chalk">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {mistakes.length > 0 && (
        <section className="border-l-2 border-ember/70 pl-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ember">Evita</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-steel">
            {mistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
