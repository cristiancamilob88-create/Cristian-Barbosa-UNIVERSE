import { requireMemberContactId } from "@/server/auth/memberAuth";
import { getMemberPlan } from "@/server/training/member";
import { GoLink } from "@/components/ui/GoLink";
import { goLinks } from "@/config/site";
import { MemberNav } from "./MemberNav";
import { LogoutButton } from "./LogoutButton";
import { WelcomeGuide } from "./WelcomeGuide";
import { UpgradeCard } from "./UpgradeCard";

// Per-student data on every request — never prerendered or cached across students.
export const dynamic = "force-dynamic";

/**
 * Shell for every signed-in /mi-plan page. requireMemberContactId() is
 * the secure session check (proxy.ts ran the optimistic one); then the
 * database decides whether this contact actually has a plan to show —
 * a valid cookie for someone whose access was removed lands on the
 * "no active plan" message, not on stale data.
 */
export default async function MemberAppLayout({ children }: LayoutProps<"/mi-plan">) {
  const contactId = await requireMemberContactId();
  const plan = await getMemberPlan(contactId);

  if (!plan) {
    return (
      <div className="flex flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Plan Diciembre</p>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-chalk">Tu plan no está activo</h1>
        <p className="text-steel">
          Tu cupo todavía no está confirmado, o tu plan terminó. Escríbele a Cristian y lo revisa contigo.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <GoLink
            slug={goLinks.whatsappCommercial}
            className="inline-flex items-center bg-ember px-5 py-3 font-mono text-xs uppercase tracking-wider text-ink hover:bg-rust"
          >
            Escribirle a Cristian
          </GoLink>
          <LogoutButton />
        </div>
      </div>
    );
  }

  const firstName = plan.name?.split(" ")[0];
  const programLabel = plan.isFree ? "Rutinas gratis" : plan.programName.split(" — ")[0];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">{programLabel}</p>
            <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-chalk sm:text-4xl">
              {firstName ? `Hola, ${firstName}` : "Tu plan"}
            </h1>
            {plan.enrollment.goal && (
              <p className="mt-2 text-sm text-steel">
                <span className="text-steel-dim">Meta:</span> {plan.enrollment.goal}
              </p>
            )}
          </div>
          <LogoutButton />
        </div>
        <MemberNav />
      </header>
      <WelcomeGuide />
      {children}
      {plan.isFree && <UpgradeCard />}
    </div>
  );
}
