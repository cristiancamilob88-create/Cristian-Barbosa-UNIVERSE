"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/states";
import { ExerciseVideo } from "@/components/training/ExerciseVideo";
import {
  AdminExercisesApiError,
  createExerciseEntry,
  fetchExerciseLibrary,
  removeExerciseVideo,
  updateExerciseEntry,
  uploadExerciseVideo,
} from "@/lib/adminExercises";
import {
  FREE_STORAGE_BYTES,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABEL,
  formatBytes,
  searchKey,
  videoSizeAdvice,
  type Exercise,
  type ExerciseInput,
  type MuscleGroup,
} from "@/lib/exercises";

const fieldClass =
  "rounded border border-steel-dim/60 bg-ink px-3 py-2 text-sm text-chalk outline-none placeholder:text-steel-dim focus:border-ember";
const primaryButton =
  "rounded bg-ember px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust disabled:opacity-60";
const ghostButton =
  "rounded border border-steel-dim/60 px-3 py-2 font-mono text-xs uppercase tracking-wider text-steel transition-colors hover:border-chalk hover:text-chalk disabled:opacity-60";
const labelClass = "font-mono text-[11px] uppercase tracking-widest text-steel";

function errorText(err: unknown, fallback: string): string {
  return err instanceof AdminExercisesApiError ? err.message : fallback;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; exercises: Exercise[]; uploadEnabled: boolean; storageUsedBytes: number | null };

export function BibliotecaPageContent() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const load = useCallback(() => {
    fetchExerciseLibrary()
      .then((data) => setState({ status: "ready", ...data }))
      .catch((err) => setState({ status: "error", message: errorText(err, "No se pudo cargar la biblioteca.") }));
  }, []);
  useEffect(load, [load]);

  const exercises = state.status === "ready" ? state.exercises : [];
  const key = searchKey(query);
  const filtered = exercises.filter((e) => (!group || e.muscleGroup === group) && (!key || searchKey(e.name).includes(key)));

  if (state.status === "loading") return <LoadingBlock />;
  if (state.status === "error") return <ErrorBlock message={state.message} />;

  function replace(updated: Exercise) {
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            exercises: current.exercises.some((e) => e.id === updated.id)
              ? current.exercises.map((e) => (e.id === updated.id ? updated : e))
              : [...current.exercises, updated],
          }
        : current,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!state.uploadEnabled && (
        <p className="border border-steel-dim/50 bg-ink-raised px-4 py-3 text-sm text-steel">
          Por ahora puedes pegar el link de un video (YouTube «no listado» funciona perfecto). La subida directa de videos se
          activa cuando se configure el almacenamiento de Supabase.
        </p>
      )}

      {state.uploadEnabled && state.storageUsedBytes !== null && <StorageMeter usedBytes={state.storageUsedBytes} />}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className={labelClass}>Buscar</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej: fondos" className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Grupo</span>
          <select value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup | "")} className={fieldClass}>
            <option value="">Todos</option>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {MUSCLE_GROUP_LABEL[g]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={primaryButton} onClick={() => setEditing("new")}>
          + Nuevo ejercicio
        </button>
      </div>

      {editing === "new" && (
        <ExerciseForm
          uploadEnabled={state.uploadEnabled}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => {
            replace(saved);
            setEditing(saved.id);
          }}
          onVideoChanged={load}
        />
      )}

      {exercises.length === 0 && editing !== "new" ? (
        <EmptyBlock message="Todavía no hay ejercicios. Crea el primero con «+ Nuevo ejercicio»." />
      ) : (
        MUSCLE_GROUPS.filter((g) => filtered.some((e) => e.muscleGroup === g)).map((g) => (
          <section key={g} className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{MUSCLE_GROUP_LABEL[g]}</h3>
            <ul className="flex flex-col gap-2">
              {filtered
                .filter((e) => e.muscleGroup === g)
                .map((exercise) =>
                  editing === exercise.id ? (
                    <li key={exercise.id}>
                      <ExerciseForm
                        exercise={exercise}
                        uploadEnabled={state.uploadEnabled}
                        onCancel={() => setEditing(null)}
                        onSaved={replace}
                        onVideoChanged={load}
                      />
                    </li>
                  ) : (
                    <li
                      key={exercise.id}
                      className={`flex flex-wrap items-center justify-between gap-3 border border-steel-dim/40 bg-ink-raised px-4 py-3 ${
                        exercise.active ? "" : "opacity-60"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-chalk">{exercise.name}</p>
                        <p className="font-mono text-[11px] uppercase tracking-widest text-steel-dim">
                          {[
                            exercise.progression,
                            exercise.uploadedVideoUrl || exercise.videoUrl ? "Con video" : "Sin video",
                            exercise.active ? null : "Oculto",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <button type="button" className={ghostButton} onClick={() => setEditing(exercise.id)}>
                        Editar
                      </button>
                    </li>
                  ),
                )}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function StorageMeter({ usedBytes }: { usedBytes: number }) {
  const ratio = Math.min(usedBytes / FREE_STORAGE_BYTES, 1);
  const tone = ratio >= 0.9 ? "bg-ember" : ratio >= 0.7 ? "bg-chalk" : "bg-tide";
  return (
    <div className="flex flex-col gap-2 border border-steel-dim/40 bg-ink-raised px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>Espacio de videos</span>
        <span className="font-mono text-sm text-chalk">
          {formatBytes(usedBytes)} de {formatBytes(FREE_STORAGE_BYTES)}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden bg-steel-dim/30"
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Espacio de videos usado"
      >
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(ratio * 100, usedBytes > 0 ? 1 : 0)}%` }} />
      </div>
      {ratio >= 0.9 && (
        <p className="text-sm text-ember">
          Casi lleno. Comprime los videos más pesados o usa links de YouTube «no listado» para los nuevos.
        </p>
      )}
    </div>
  );
}

function ExerciseForm({
  exercise,
  uploadEnabled,
  onSaved,
  onCancel,
  onVideoChanged,
}: {
  exercise?: Exercise;
  uploadEnabled: boolean;
  onSaved: (exercise: Exercise) => void;
  onCancel: () => void;
  /** After an upload/removal — refreshes the storage meter. */
  onVideoChanged: () => void;
}) {
  const [pending, setPending] = useState<"save" | "upload" | "remove" | null>(null);
  // A heavy (but allowed) file waits here until Cristian confirms or cancels.
  const [heavyFile, setHeavyFile] = useState<{ file: File; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [current, setCurrent] = useState<Exercise | undefined>(exercise);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: ExerciseInput = {
      name: String(data.get("name") ?? ""),
      muscleGroup: String(data.get("muscleGroup")) as MuscleGroup,
      description: String(data.get("description") ?? ""),
      commonMistakes: String(data.get("commonMistakes") ?? ""),
      progression: String(data.get("progression") ?? ""),
      videoUrl: String(data.get("videoUrl") ?? ""),
      active: data.get("active") === "on",
    };
    setPending("save");
    setError(null);
    try {
      const saved = current ? await updateExerciseEntry(current.id, input) : await createExerciseEntry(input);
      setCurrent(saved);
      setNotice(current ? "Guardado." : "Creado. Ya puedes subirle un video.");
      onSaved(saved);
    } catch (err) {
      setError(errorText(err, "No se pudo guardar."));
    } finally {
      setPending(null);
    }
  }

  function chooseFile(file: File) {
    setNotice(null);
    const advice = videoSizeAdvice(file.size);
    if (advice.level === "too_big") {
      setError(advice.message);
      return;
    }
    if (advice.level === "heavy") {
      setError(null);
      setHeavyFile({ file, message: advice.message });
      return;
    }
    void upload(file);
  }

  async function upload(file: File) {
    if (!current) return;
    setHeavyFile(null);
    setPending("upload");
    setError(null);
    try {
      const saved = await uploadExerciseVideo(current.id, file);
      setCurrent(saved);
      setNotice(`Video subido (${formatBytes(file.size)}).`);
      onSaved(saved);
      onVideoChanged();
    } catch (err) {
      setError(errorText(err, "No se pudo subir el video."));
    } finally {
      setPending(null);
    }
  }

  async function removeVideo() {
    if (!current) return;
    setPending("remove");
    setError(null);
    try {
      const saved = await removeExerciseVideo(current.id);
      setCurrent(saved);
      onSaved(saved);
      onVideoChanged();
    } catch (err) {
      setError(errorText(err, "No se pudo quitar el video."));
    } finally {
      setPending(null);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border border-ember/50 bg-ink-raised p-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Nombre</span>
        <input name="name" required maxLength={120} defaultValue={current?.name} placeholder="Ej: Fondos en paralelas" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Grupo</span>
        <select name="muscleGroup" defaultValue={current?.muscleGroup ?? "pecho"} className={fieldClass}>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {MUSCLE_GROUP_LABEL[g]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Cómo se hace</span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={current?.description ?? ""}
          placeholder={"Un paso por línea. Ej:\nManos al ancho de hombros\nBaja hasta 90° de codo\nSube sin bloquear los codos"}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Errores comunes</span>
        <textarea
          name="commonMistakes"
          rows={2}
          maxLength={1000}
          defaultValue={current?.commonMistakes ?? ""}
          placeholder="Ej: hombros hacia las orejas, bajar sin control"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Progresión (opcional)</span>
        <input name="progression" maxLength={120} defaultValue={current?.progression ?? ""} placeholder="Ej: Dominada · paso 2 de 4" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Link del video (opcional)</span>
        <input name="videoUrl" type="url" maxLength={500} defaultValue={current?.videoUrl ?? ""} placeholder="https://youtu.be/…" className={fieldClass} />
      </label>
      <label className="flex items-center gap-2 text-sm text-chalk sm:col-span-2">
        <input name="active" type="checkbox" defaultChecked={current?.active ?? true} className="h-4 w-4 accent-ember" />
        Visible para los alumnos
      </label>

      {current && (current.uploadedVideoUrl || current.videoUrl) && (
        <div className="sm:col-span-2">
          <ExerciseVideo exercise={current} title={current.name} />
        </div>
      )}

      {current && uploadEnabled && (
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <label className={`${ghostButton} cursor-pointer`}>
            {pending === "upload" ? "Subiendo…" : current.uploadedVideoUrl ? "Cambiar video" : "Subir video"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              disabled={pending !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) chooseFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {current.uploadedVideoUrl && (
            <button type="button" className={ghostButton} disabled={pending !== null} onClick={removeVideo}>
              {pending === "remove" ? "Quitando…" : "Quitar video subido"}
            </button>
          )}
          <span className="text-xs text-steel-dim">
            MP4, MOV o WebM · máx. 50 MB · ideal: clip de 20 s en 720p, vertical, sin audio (3–5 MB)
          </span>
        </div>
      )}

      {heavyFile && (
        <div role="alertdialog" aria-label="Video pesado" className="flex flex-col gap-3 border border-chalk/40 bg-ink p-4 sm:col-span-2">
          <p className="text-sm text-chalk">{heavyFile.message}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={ghostButton} onClick={() => setHeavyFile(null)}>
              Cancelar y comprimirlo
            </button>
            <button type="button" className={primaryButton} onClick={() => void upload(heavyFile.file)}>
              Subir igual
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-ember sm:col-span-2">
          {error}
        </p>
      )}
      {notice && !error && <p className="text-sm text-tide sm:col-span-2">{notice}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending !== null} className={primaryButton}>
          {pending === "save" ? "Guardando…" : current ? "Guardar" : "Crear ejercicio"}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          Cerrar
        </button>
      </div>
    </form>
  );
}
