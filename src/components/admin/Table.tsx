import type { ReactNode } from "react";

export interface Column<Row> {
  header: string;
  align?: "left" | "right";
  render: (row: Row) => ReactNode;
}

/**
 * One generic table renderer for every "performance table" shape in the
 * brief (SOURCE | VISITORS | LEADS | PURCHASES | REVENUE | CONVERSION,
 * and its QR/landing/campaign/product variants) — columns are just data,
 * so a new breakdown is a new `Column[]` array, not a new table
 * component. Scrolls horizontally on narrow screens instead of
 * squeezing columns unreadably (docs/COMMAND_CENTER.md, "Responsive").
 */
export function Table<Row>({ columns, rows, keyFor }: { columns: Column<Row>[]; rows: Row[]; keyFor: (row: Row) => string }) {
  return (
    <div className="overflow-x-auto rounded border border-steel-dim/40">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-steel-dim/40 bg-ink-raised">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-steel ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFor(row)} className="border-b border-steel-dim/20 last:border-0 hover:bg-ink-raised/60">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 text-chalk ${col.align === "right" ? "text-right" : "text-left"}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
