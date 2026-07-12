import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { prisma } from "@/lib/prisma";
import { getActiveDynasty } from "@/lib/dynasty/active";
import { ScheduleBuilder } from "./schedule-builder";

export const metadata = { title: "Build your schedule" };
export const dynamic = "force-dynamic";

export default async function OnboardingSchedulePage() {
  const active = await getActiveDynasty();
  if (!active) redirect("/");
  if (!active.controlledTeam) redirect("/onboarding/team");
  // Schedule already built (current week set) → into the dynasty.
  if (active.dynasty.currentWeekId) redirect("/dashboard");

  const teams = await prisma.team.findMany({
    where: { dynastyId: active.dynasty.id },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, nickname: true },
  });
  const opponents = teams.filter((t) => t.id !== active.controlledTeam!.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Build your schedule"
        description={`Set ${active.controlledTeam.name}'s season for ${active.dynasty.name}. Pick each week's opponent and whether it's home (vs) or away (@). You can leave a week empty for a bye.`}
      />
      <ScheduleBuilder
        dynastyId={active.dynasty.id}
        teamName={active.controlledTeam.name}
        opponents={opponents.map((t) => ({ id: t.id, name: t.name }))}
        defaultYear={new Date().getFullYear()}
      />
    </div>
  );
}
