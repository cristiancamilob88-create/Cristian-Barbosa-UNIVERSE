/** The three non-happy-path states every /admin section renders identically. */

export function LoadingBlock() {
  return (
    <div role="status" className="rounded border border-steel-dim/40 bg-ink-raised px-6 py-10 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-steel">Cargando…</p>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded border border-rust/60 bg-ink-raised px-6 py-10 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-rust">Error</p>
      <p className="mt-2 text-sm text-steel">{message}</p>
    </div>
  );
}

export function EmptyBlock({ message = "Sin datos todavía para este rango." }: { message?: string }) {
  return (
    <div className="rounded border border-dashed border-steel-dim/50 px-6 py-10 text-center">
      <p className="text-sm text-steel">{message}</p>
    </div>
  );
}
