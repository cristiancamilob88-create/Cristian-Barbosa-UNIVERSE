"use client";

import { useState } from "react";
import Link from "next/link";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABEL, searchKey, type Exercise, type MuscleGroup } from "@/lib/exercises";

/** Search + group filter over the library — instant, client-side (it's a few dozen entries). */
export function LibraryBrowser({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");

  const groups = MUSCLE_GROUPS.filter((g) => exercises.some((e) => e.muscleGroup === g));
  const key = searchKey(query);
  const filtered = exercises.filter((e) => (!group || e.muscleGroup === group) && (!key || searchKey(e.name).includes(key)));

  const chip = (active: boolean) =>
    `whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
      active ? "border-ember bg-ember text-ink" : "border-steel-dim/50 text-steel hover:text-chalk"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Busca un ejercicio…"
        aria-label="Buscar ejercicio"
        className="w-full border border-steel-dim/60 bg-ink-raised px-4 py-3 text-chalk outline-none placeholder:text-steel-dim focus:border-ember"
      />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button type="button" className={chip(group === "")} onClick={() => setGroup("")}>
          Todos
        </button>
        {groups.map((g) => (
          <button key={g} type="button" className={chip(group === g)} onClick={() => setGroup(g)}>
            {MUSCLE_GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-steel">No encontramos ese ejercicio.</p>
      ) : (
        groups
          .filter((g) => filtered.some((e) => e.muscleGroup === g))
          .map((g) => (
            <section key={g} className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{MUSCLE_GROUP_LABEL[g]}</h2>
              <ul className="flex flex-col border border-steel-dim/40 bg-ink-raised">
                {filtered
                  .filter((e) => e.muscleGroup === g)
                  .map((exercise) => (
                    <li key={exercise.id} className="border-b border-steel-dim/30 last:border-b-0">
                      <Link
                        href={`/mi-plan/biblioteca/${exercise.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink"
                      >
                        <span>
                          <span className="block font-semibold text-chalk">{exercise.name}</span>
                          {exercise.progression && <span className="block text-sm text-steel">{exercise.progression}</span>}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-steel-dim">
                          {exercise.uploadedVideoUrl || exercise.videoUrl ? "▶ Video" : "Ver"}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
