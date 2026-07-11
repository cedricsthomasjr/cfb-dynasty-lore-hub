import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PagePlaceholder
      title="Search"
      description="Find any team, player, coach, game, or article across the dynasty."
      phase="Phase 6"
      bullets={[
        "Full-text search across entities",
        "Jump to profiles and games",
        "Recent and suggested results",
      ]}
    />
  );
}
