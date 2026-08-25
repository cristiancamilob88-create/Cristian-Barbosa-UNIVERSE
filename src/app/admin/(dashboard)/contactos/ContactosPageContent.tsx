"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/admin/Table";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/states";
import { formatDateTime } from "@/lib/format";
import { fetchContacts, AdminContactsApiError, type ContactLeadRow } from "@/lib/adminContacts";

const STATUS_LABEL: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  won: "Ganado",
  lost: "Perdido",
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ContactLeadRow[] };

/**
 * Real contact detail (name/email/phone) — see src/server/admin/contacts.ts's
 * doc comment for why this is a separate fetch from every other admin
 * section (its own endpoint, its own DTO file, no AnalyticsBoundary/
 * date range — a snapshot of who to follow up with, not a trend).
 * Same loading/error/empty visual states as the rest of the Command
 * Center (`states.tsx`), just driven by a plain fetch instead of
 * `useAnalyticsQuery`.
 */
export function ContactosPageContent() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    // No re-fetch trigger (no date range/params here, unlike
    // useAnalyticsQuery) — this runs once on mount, and the initial
    // useState value above is already "loading", so there's nothing to
    // reset here (an unconditional setState at the top of an effect
    // body trips react-hooks/set-state-in-effect regardless).
    fetchContacts()
      .then((res) => {
        if (!cancelled) setState({ status: "ready", data: res.data });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof AdminContactsApiError ? err.message : "Error inesperado consultando contactos.";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <LoadingBlock />;
  if (state.status === "error") return <ErrorBlock message={state.message} />;
  if (state.data.length === 0) return <EmptyBlock message="Sin registros todavía." />;

  return (
    <Table<ContactLeadRow>
      keyFor={(row) => row.leadId}
      columns={[
        { header: "Fecha", render: (r) => formatDateTime(r.createdAt) },
        { header: "Nombre", render: (r) => r.contactName ?? "—" },
        { header: "Email", render: (r) => r.contactEmail ?? "—" },
        { header: "Teléfono", render: (r) => r.contactPhone ?? "—" },
        { header: "Tema", render: (r) => r.topicRaw },
        { header: "Interés", render: (r) => r.interestLabel ?? "—" },
        { header: "Mensaje", render: (r) => r.message ?? "—" },
        { header: "Fuente", render: (r) => r.sourceLabel ?? "—" },
        { header: "Campaña", render: (r) => r.campaignLabel ?? "—" },
        { header: "QR", render: (r) => r.qrSlug ?? "—" },
        { header: "Estado", render: (r) => STATUS_LABEL[r.status] ?? r.status },
      ]}
      rows={state.data}
    />
  );
}
