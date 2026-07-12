import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveDynasty } from "@/lib/dynasty/active";
import { onboardingNextStep } from "@/lib/dynasty/onboarding";
import { TeamSelection } from "./team-selection";

export const metadata = { title: "Pick your team" };
export const dynamic = "force-dynamic";

/**
 * Post-join onboarding step: the user has a dynasty but no controlled team yet.
 * Once controlledTeamId is set we're done here — send them to League Home.
 * With no active dynasty there's nothing to pick a team for, so bounce to
 * League Home too (it renders the create/join onboarding CTA).
 */
export default async function OnboardingTeamPage() {
  const active = await getActiveDynasty();
  if (!active) redirect("/");
  // Team already chosen → continue the funnel (schedule, then dashboard).
  if (active.controlledTeam) {
    redirect(
      onboardingNextStep({
        controlledTeamId: active.controlledTeam.id,
        currentWeekId: active.dynasty.currentWeekId,
      })
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Pick your team"
        description={`Choose the program you control in ${active.dynasty.name}. This is your one team for this dynasty — you can pick any FBS school or add a custom program.`}
      />
      <TeamSelection dynastyId={active.dynasty.id} />
    </div>
  );
}
