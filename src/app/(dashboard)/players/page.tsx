import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Players" };

export default function PlayersPage() {
  return (
    <PagePlaceholder
      title="Players"
      description="Player profiles with season and career statistics."
      phase="Phase 3"
      bullets={[
        "Searchable player directory",
        "Season and career stat lines",
        "Awards and record appearances",
      ]}
    />
  );
}
