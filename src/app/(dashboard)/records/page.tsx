import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "School Records" };

export default function SchoolRecordsPage() {
  return (
    <PagePlaceholder
      title="School Records"
      description="Program record books — single-game, season, and career marks."
      phase="Phase 4"
      bullets={[
        "Single-game, season, career records",
        "Record holders and context",
        "Record-broken alerts feed",
      ]}
    />
  );
}
