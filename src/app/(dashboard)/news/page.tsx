import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Latest News" };

export default function NewsPage() {
  return (
    <PagePlaceholder
      title="Latest News"
      description="ESPN-style articles generated only from verified dynasty data."
      phase="Phase 5"
      bullets={[
        "Breaking news and weekly headlines",
        "Game recaps and previews",
        "Every claim traceable to source data",
      ]}
    />
  );
}
