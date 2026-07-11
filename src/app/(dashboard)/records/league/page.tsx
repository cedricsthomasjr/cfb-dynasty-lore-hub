import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "League Records" };

export default function LeagueRecordsPage() {
  return (
    <PagePlaceholder
      title="League Records"
      description="League-wide and national record books across all programs."
      phase="Phase 4"
      bullets={[
        "National single-game and season marks",
        "Cross-program leaderboards",
        "All-time league milestones",
      ]}
    />
  );
}
