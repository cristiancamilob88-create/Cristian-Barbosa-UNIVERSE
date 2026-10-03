import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { BibliotecaPageContent } from "./BibliotecaPageContent";

export const metadata: Metadata = { title: "Biblioteca" };

/**
 * The exercise library (docs/TRAINING.md, "Exercise library", 2026-10-03):
 * each exercise with its group, how it's done, common mistakes,
 * progression and Cristian's own video. Students open it from their
 * routine when he isn't there. Data via /api/admin/exercises.
 */
export default function AdminBibliotecaPage() {
  return (
    <>
      <SectionHeader
        tag="TRAIN"
        title="Biblioteca de ejercicios"
        description="Cada ejercicio con cómo se hace, errores comunes y tu video. Tus alumnos lo abren desde su rutina cuando tú no estás."
        hideDateRange
      />
      <BibliotecaPageContent />
    </>
  );
}
