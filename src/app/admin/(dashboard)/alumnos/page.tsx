import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AlumnosPageContent } from "./AlumnosPageContent";

export const metadata: Metadata = { title: "Alumnos" };

/**
 * Plan Diciembre students (docs/TRAINING.md, 2026-09-30): approve
 * sign-ups, add students signed up in person, send the WhatsApp invite,
 * and see who's keeping up this week. Same architecture as
 * /admin/contactos — its own module, endpoint and DTO file (real PII),
 * no date range.
 */
export default function AdminAlumnosPage() {
  return (
    <>
      <SectionHeader
        tag="TRAIN"
        title="Alumnos"
        description="Inscripciones por aprobar y cómo va cada alumno esta semana: Al día (80% o más), A medias (40–79%) o Se está quedando (menos de 40%)."
        hideDateRange
      />
      <AlumnosPageContent />
    </>
  );
}
