import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Conference Standings" };

export default function StandingsPage() {
  return (
    <PagePlaceholder
      title="Conference Standings"
      description="Conference and overall records for every team, by week."
      phase="Phase 3"
      bullets={[
        "Standings grouped by conference",
        "Conference vs. overall records",
        "Historical standings snapshots",
      ]}
    />
  );
}
