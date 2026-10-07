"use client";

import { ProgressView } from "@/components/training/ProgressView";
import type { Measurement, MeasurementInput } from "@/lib/training";

async function call<T>(url: string, init: RequestInit): Promise<T | string> {
  try {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; data?: T } | null;
    if (!res.ok || !body?.ok) return body?.error ?? "No se guardó.";
    return body.data as T;
  } catch {
    return "Sin conexión: no se guardó.";
  }
}

export function MemberProgress({ measurements, canEdit }: { measurements: Measurement[]; canEdit: boolean }) {
  return (
    <ProgressView
      measurements={measurements}
      canEdit={canEdit}
      onAdd={(input: MeasurementInput) =>
        call<Measurement>("/api/member/measurements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
      }
      onDelete={async (id) => {
        const result = await call<unknown>(`/api/member/measurements?id=${id}`, { method: "DELETE" });
        return typeof result === "string" ? result : null;
      }}
    />
  );
}
