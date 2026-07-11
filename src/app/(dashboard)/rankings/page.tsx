import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Top 25" };

export default function RankingsPage() {
  return (
    <PagePlaceholder
      title="Top 25 Rankings"
      description="Weekly AP & Coaches poll snapshots with week-over-week movement."
      phase="Phase 3"
      bullets={[
        "Full Top 25 with records",
        "Rank change vs. previous week",
        "Historical snapshots per week",
      ]}
    />
  );
}
