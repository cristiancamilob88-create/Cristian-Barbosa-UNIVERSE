import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { ProductosPageContent } from "./ProductosPageContent";

export const metadata: Metadata = { title: "Productos" };

/**
 * Section 8 — Products/offers (FASE 4). Both tables come straight from
 * GET /api/analytics/products. If `orders` has no paid rows yet in
 * range, the revenue table renders the explicit empty state below — no
 * simulated/fabricated revenue is ever shown ("NO utilizar datos
 * simulados en producción"). Kept as a Server Component only for
 * `metadata` — see OverviewPageContent.tsx's doc comment for why the
 * content itself moved to a Client Component.
 */
export default function AdminProductosPage() {
  return (
    <>
      <SectionHeader tag="Catálogo" title="Productos y ofertas" description="Vistas de producto y revenue por producto/oferta." />
      <ProductosPageContent />
    </>
  );
}
