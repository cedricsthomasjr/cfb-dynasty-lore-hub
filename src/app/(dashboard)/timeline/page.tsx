import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Dynasty Timeline" };

export default function TimelinePage() {
  return (
    <PagePlaceholder
      title="Dynasty Timeline"
      description="A chronological story of your program's defining moments."
      phase="Phase 4"
      bullets={[
        "Championships, upsets, and milestones",
        "Coaching changes and rivalries",
        "Filterable, chronological lore feed",
      ]}
    />
  );
}
