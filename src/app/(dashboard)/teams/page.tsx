import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <PagePlaceholder
      title="Teams"
      description="Every program in the dynasty — records, rosters, and history."
      phase="Phase 3"
      bullets={[
        "Team directory with branding",
        "Roster, schedule, and stats",
        "All-time program history",
      ]}
    />
  );
}
