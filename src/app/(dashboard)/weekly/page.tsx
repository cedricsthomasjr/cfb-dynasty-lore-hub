import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Weekly Dashboard" };

export default function WeeklyPage() {
  return (
    <PagePlaceholder
      title="Weekly Dashboard"
      description="The current week at a glance — scores, movers, and headlines."
      phase="Phase 3"
      bullets={[
        "This week's games and results",
        "Ranking movement and upsets",
        "Auto-generated weekly headlines",
      ]}
    />
  );
}
