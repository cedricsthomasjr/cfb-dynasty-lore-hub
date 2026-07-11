import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Season History" };

export default function HistoryPage() {
  return (
    <PagePlaceholder
      title="Season History"
      description="Every season archived — champions, results, and leaders."
      phase="Phase 4"
      bullets={[
        "Season-by-season summaries",
        "Champions and final rankings",
        "Statistical leaders per season",
      ]}
    />
  );
}
