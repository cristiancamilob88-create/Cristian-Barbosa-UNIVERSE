"use client";

const PRESETS = [
  { value: "acquisition-to-purchase", label: "Adquisición → Compra" },
  { value: "training-to-lead", label: "Entrenamiento → Registro" },
] as const;

/** Mirrors PRESET_FUNNELS' keys (src/server/analytics/funnel.ts) — no funnel logic here, just which preset to ask for. */
export function FunnelPresetControl({ value, onChange }: { value: string; onChange: (preset: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onChange(preset.value)}
          className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
            value === preset.value
              ? "border-ember bg-ember text-ink"
              : "border-steel-dim/60 text-steel hover:border-steel hover:text-chalk"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
