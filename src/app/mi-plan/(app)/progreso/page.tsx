import type { Metadata } from "next";
import { requireMemberContactId } from "@/server/auth/memberAuth";
import { getMemberPlan } from "@/server/training/member";
import { getPool } from "@/server/db/pool";
import { listMeasurements } from "@/server/db/repositories/training";
import { MemberProgress } from "./MemberProgress";

export const metadata: Metadata = { title: "Mi progreso" };

/** "Mi progreso" — the student's max tests over time (docs/TRAINING.md). */
export default async function MemberProgressPage() {
  const contactId = await requireMemberContactId();
  const plan = await getMemberPlan(contactId);
  if (!plan) return null;
  const measurements = await listMeasurements(getPool(), plan.enrollment.id);
  return <MemberProgress measurements={measurements} canEdit={plan.enrollment.status === "active"} />;
}
