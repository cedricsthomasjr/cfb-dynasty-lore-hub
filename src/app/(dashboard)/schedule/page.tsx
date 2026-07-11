import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <PagePlaceholder
      title="Schedule"
      description="Full season schedule with results and upcoming matchups."
      phase="Phase 3"
      bullets={[
        "Week-by-week schedule",
        "Results and kickoff details",
        "Filter by team or conference",
      ]}
    />
  );
}
