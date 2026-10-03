import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ExerciseInput, MuscleGroup } from "@/lib/exercises";

/** An exercise row as stored — `videoPath` is resolved to a public URL by the caller (src/server/storage/exerciseVideos.ts). */
export interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string | null;
  commonMistakes: string | null;
  progression: string | null;
  videoUrl: string | null;
  videoPath: string | null;
  active: boolean;
}

interface RawExerciseRow {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  description: string | null;
  common_mistakes: string | null;
  progression: string | null;
  video_url: string | null;
  video_path: string | null;
  active: boolean;
}

const COLUMNS = "id, name, muscle_group, description, common_mistakes, progression, video_url, video_path, active";

function toExercise(row: RawExerciseRow): ExerciseRow {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    description: row.description,
    commonMistakes: row.common_mistakes,
    progression: row.progression,
    videoUrl: row.video_url,
    videoPath: row.video_path,
    active: row.active,
  };
}

/** The library, by group then name. Students only ever see active entries. */
export async function listExercises(db: Pool | PoolClient, options: { activeOnly: boolean }): Promise<ExerciseRow[]> {
  const result = await db.query<RawExerciseRow>(
    `select ${COLUMNS} from exercise ${options.activeOnly ? "where active" : ""} order by muscle_group, lower(name)`,
  );
  return result.rows.map(toExercise);
}

export async function getExercise(db: Pool | PoolClient, id: string): Promise<ExerciseRow | null> {
  const result = await db.query<RawExerciseRow>(`select ${COLUMNS} from exercise where id = $1`, [id]);
  return result.rows[0] ? toExercise(result.rows[0]) : null;
}

/** Thrown when another exercise already has this name (case-insensitive) — the route answers 409. */
export class DuplicateExerciseNameError extends Error {
  constructor() {
    super("An exercise with this name already exists");
    this.name = "DuplicateExerciseNameError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

export async function createExercise(db: Pool | PoolClient, input: ExerciseInput): Promise<ExerciseRow> {
  try {
    const result = await db.query<RawExerciseRow>(
      `insert into exercise (name, muscle_group, description, common_mistakes, progression, video_url, active)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning ${COLUMNS}`,
      [
        input.name,
        input.muscleGroup,
        input.description ?? null,
        input.commonMistakes ?? null,
        input.progression ?? null,
        input.videoUrl ?? null,
        input.active ?? true,
      ],
    );
    return toExercise(result.rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateExerciseNameError();
    throw err;
  }
}

export async function updateExercise(db: Pool | PoolClient, id: string, input: ExerciseInput): Promise<ExerciseRow | null> {
  try {
    const result = await db.query<RawExerciseRow>(
      `update exercise set
         name = $2, muscle_group = $3, description = $4, common_mistakes = $5, progression = $6,
         video_url = $7, active = coalesce($8, active), updated_at = now()
       where id = $1
       returning ${COLUMNS}`,
      [
        id,
        input.name,
        input.muscleGroup,
        input.description ?? null,
        input.commonMistakes ?? null,
        input.progression ?? null,
        input.videoUrl ?? null,
        input.active ?? null,
      ],
    );
    return result.rows[0] ? toExercise(result.rows[0]) : null;
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateExerciseNameError();
    throw err;
  }
}

/** Attaches (or with null, removes) the uploaded video; returns the previous path so the caller can delete that file. */
export async function setExerciseVideoPath(
  client: PoolClient,
  id: string,
  path: string | null,
): Promise<{ previousPath: string | null } | null> {
  const previous = await client.query<{ video_path: string | null }>(
    "select video_path from exercise where id = $1 for update",
    [id],
  );
  if (!previous.rows[0]) return null;
  await client.query("update exercise set video_path = $2, updated_at = now() where id = $1", [id, path]);
  return { previousPath: previous.rows[0].video_path };
}
