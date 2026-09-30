import type { Metadata } from "next";
import Link from "next/link";
import { StudentPageContent } from "./StudentPageContent";

export const metadata: Metadata = { title: "Ficha del alumno" };

/**
 * One student (docs/TRAINING.md, "Personalized routines"): their
 * objective and profile, what they logged each week (check-offs, what
 * they actually did, notes), and the editor for THEIR routine — every
 * student's plan is their own; templates are only a starting point.
 * Same Command Center rule as every section: data comes from
 * /api/admin/training/*, never a query here.
 */
export default async function AdminStudentPage(props: PageProps<"/admin/alumnos/[id]">) {
  const { id } = await props.params;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/alumnos" className="w-fit font-mono text-xs uppercase tracking-wider text-steel hover:text-chalk">
        ← Alumnos
      </Link>
      <StudentPageContent enrollmentId={id} />
    </div>
  );
}
