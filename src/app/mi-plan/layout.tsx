import type { Metadata, Viewport } from "next";
import { Container } from "@/components/ui/Container";

/**
 * The student area (docs/TRAINING.md) — private, never indexed, and
 * installable on a phone's home screen with its own manifest scoped to
 * /mi-plan, so the installed app opens straight into the student's week
 * instead of the Universe homepage.
 */
export const metadata: Metadata = {
  title: { default: "Mi plan", template: "%s — Mi plan" },
  robots: { index: false, follow: false },
  manifest: "/mi-plan/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mi plan", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0c",
};

export default function MiPlanLayout({ children }: LayoutProps<"/mi-plan">) {
  return <Container className="max-w-2xl py-10 sm:py-14">{children}</Container>;
}
