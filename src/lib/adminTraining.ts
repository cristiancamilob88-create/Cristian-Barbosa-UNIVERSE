/**
 * Client-side contract for `/api/admin/training/*` (/admin/alumnos) —
 * its own DTO file like adminContacts.ts, since these rows carry real
 * names/emails/phones (never mixed into the aggregates-only
 * adminAnalytics.ts).
 */
import type { EnrollmentLevel, EnrollmentStatus, WeekStanding } from "./training";

export interface TrainingRosterRow {
  enrollmentId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  programName: string;
  status: EnrollmentStatus;
  level: EnrollmentLevel;
  zone: string | null;
  goal: string | null;
  startDate: string | null;
  weeks: number;
  currentWeek: number | null;
  weekPercent: number | null;
  standing: WeekStanding | null;
  standingLabel: string | null;
  lastNote: string | null;
  createdAt: string;
}

export interface NewStudentInput {
  name: string;
  email: string;
  phone: string;
  goal: string;
  level: EnrollmentLevel;
  zone: string;
  /** Set = approve on the spot; omitted = lands as a pending sign-up. */
  startDate?: string;
}

export class AdminTrainingApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminTrainingApiError";
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  let body: { ok?: boolean; error?: string; data?: T } = {};
  try {
    body = await res.json();
  } catch {
    // fall through — !res.ok below still produces a useful error
  }
  if (!res.ok || body.ok !== true) {
    throw new AdminTrainingApiError(res.status, body.error ?? `La solicitud falló (${res.status}).`);
  }
  return body.data as T;
}

export function fetchTrainingRoster(): Promise<TrainingRosterRow[]> {
  return request<TrainingRosterRow[]>("/api/admin/training/enrollments");
}

export function createStudent(input: NewStudentInput): Promise<{ enrollmentId: string; status: EnrollmentStatus }> {
  return request("/api/admin/training/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateStudent(enrollmentId: string, startDate: string): Promise<{ enrollmentId: string; status: EnrollmentStatus }> {
  return request(`/api/admin/training/enrollments/${enrollmentId}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate }),
  });
}

/** The WhatsApp invitation Cristian copies/sends once a student is approved. */
export function invitationMessage(name: string | null, siteOrigin: string): string {
  const first = name?.trim().split(/\s+/)[0];
  return [
    `¡Hola${first ? ` ${first}` : ""}! Tu cupo en el Plan Diciembre está confirmado 💪`,
    `Entra a tu plan con tu correo aquí: ${siteOrigin}/mi-plan/entrar — te llega un código de 6 dígitos.`,
    "En el celular, agrégalo a la pantalla de inicio para tenerlo como una app.",
  ].join("\n\n");
}

/**
 * wa.me link for a stored phone. Colombian mobiles are usually typed
 * without the country code ("300 123 4567"), so a bare 10-digit number
 * starting with 3 gets 57 in front; anything already international is
 * kept as typed. Null when there's no usable number.
 */
export function whatsappLink(phone: string | null, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  const international = digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}
