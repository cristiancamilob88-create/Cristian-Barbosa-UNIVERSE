import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { QrPageContent } from "./QrPageContent";

export const metadata: Metadata = { title: "QR" };

/**
 * Section 4 — QR performance (FASE 4). One row per registered
 * `qr_source` — no code names a specific QR ("Aura") anywhere in this
 * page; every code that exists in the database shows up automatically
 * (docs/COMMAND_CENTER.md, "QR is never hardcoded"). Kept as a Server
 * Component only for `metadata` — see OverviewPageContent.tsx's doc
 * comment for why the content itself moved to a Client Component.
 */
export default function AdminQrPage() {
  return (
    <>
      <SectionHeader
        tag="Físico → digital"
        title="QR performance"
        description="Shows, universidades, colegios, ferias, eventos — cada código registrado, de scan a compra."
      />
      <QrPageContent />
    </>
  );
}
