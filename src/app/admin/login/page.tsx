import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Acceso — Command Center",
  robots: { index: false, follow: false },
};

/**
 * Public route (not wrapped by the (dashboard) layout's requireAdminSession
 * — see src/proxy.ts, which redirects a *logged-in* admin away from here
 * back to /admin instead). No public nav link points here
 * (docs/COMMAND_CENTER.md, "Why /admin has no nav entry").
 */
export default function AdminLoginPage() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-lg">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Command Center</p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-chalk">Acceso admin</h1>
        <p className="mt-4 text-steel">Panel privado — solo Cristian.</p>
        <LoginForm />
      </Container>
    </section>
  );
}
