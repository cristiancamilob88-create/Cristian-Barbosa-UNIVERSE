"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/admin/Table";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/states";
import { formatDateTime, formatCents } from "@/lib/format";
import { fetchOpportunities, AdminOpportunitiesApiError, type B2bOpportunityRow } from "@/lib/adminOpportunities";

const CATEGORY_LABEL: Record<string, string> = {
  shows: "Shows",
  brands: "Marcas",
  sponsors: "Patrocinios",
};

const STAGE_LABEL: Record<string, string> = {
  lead: "Nuevo",
  qualified: "Calificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: B2bOpportunityRow[] };

/**
 * Real contact detail (name/email/phone) for the shows/brands/sponsors
 * pipeline — see src/server/admin/opportunities.ts's doc comment for
 * why this is its own fetch, separate from every /api/analytics/*
 * section (its own endpoint, its own DTO file, no AnalyticsBoundary/
 * date range). Same shape as ContactosPageContent.tsx, driven by a
 * plain fetch instead of useAnalyticsQuery.
 */
export function NegociosPageContent() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchOpportunities()
      .then((res) => {
        if (!cancelled) setState({ status: "ready", data: res.data });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof AdminOpportunitiesApiError ? err.message : "Error inesperado consultando negocios.";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <LoadingBlock />;
  if (state.status === "error") return <ErrorBlock message={state.message} />;
  if (state.data.length === 0) return <EmptyBlock message="Sin solicitudes de shows, marcas o patrocinios todavía." />;

  return (
    <Table<B2bOpportunityRow>
      keyFor={(row) => row.id}
      columns={[
        { header: "Fecha", render: (r) => formatDateTime(r.createdAt) },
        { header: "Categoría", render: (r) => CATEGORY_LABEL[r.category] ?? r.category },
        { header: "Nombre", render: (r) => r.contactName ?? "—" },
        { header: "Email", render: (r) => r.contactEmail ?? "—" },
        { header: "Teléfono", render: (r) => r.contactPhone ?? "—" },
        { header: "Mensaje", render: (r) => r.notes ?? "—" },
        { header: "Campaña", render: (r) => r.campaignLabel ?? "—" },
        { header: "Fuente", render: (r) => r.sourceLabel ?? "—" },
        {
          header: "Valor estimado",
          align: "right",
          render: (r) => (r.estimatedValueCents === null ? "—" : formatCents(r.estimatedValueCents)),
        },
        { header: "Etapa", render: (r) => STAGE_LABEL[r.stage] ?? r.stage },
      ]}
      rows={state.data}
    />
  );
}
