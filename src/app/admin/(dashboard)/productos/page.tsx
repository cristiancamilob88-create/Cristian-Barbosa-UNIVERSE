import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents } from "@/lib/format";
import type { ProductsResponse, ProductViewRow, ProductRevenueRow } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Productos" };

/**
 * Section 8 — Products/offers (FASE 4). Both tables come straight from
 * GET /api/analytics/products. If `orders` has no paid rows yet in
 * range, the revenue table renders the explicit empty state below — no
 * simulated/fabricated revenue is ever shown ("NO utilizar datos
 * simulados en producción").
 */
export default function AdminProductosPage() {
  return (
    <>
      <SectionHeader tag="Catálogo" title="Productos y ofertas" description="Vistas de producto y revenue por producto/oferta." />
      <AnalyticsBoundary<ProductsResponse> path="products">
        {({ data }) => (
          <div className="flex flex-col gap-10">
            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Vistas de producto</h2>
              {data.views.length === 0 ? (
                <p className="text-sm text-steel">Sin vistas de producto registradas todavía.</p>
              ) : (
                <Table<ProductViewRow>
                  keyFor={(row) => row.productSlug}
                  columns={[
                    { header: "Producto", render: (r) => r.productName },
                    { header: "Views", align: "right", render: (r) => formatInteger(r.views) },
                    { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
                  ]}
                  rows={data.views}
                />
              )}
            </div>

            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Revenue por producto/oferta</h2>
              {data.revenue.length === 0 ? (
                <p className="text-sm text-steel">Sin ventas registradas todavía.</p>
              ) : (
                <Table<ProductRevenueRow>
                  keyFor={(row) => `${row.productSlug}-${row.offerSlug}`}
                  columns={[
                    { header: "Producto", render: (r) => r.productName },
                    { header: "Oferta", render: (r) => r.offerSlug },
                    { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
                    { header: "Revenue", align: "right", render: (r) => formatCents(r.revenueCents) },
                  ]}
                  rows={data.revenue}
                />
              )}
            </div>
          </div>
        )}
      </AnalyticsBoundary>
    </>
  );
}
