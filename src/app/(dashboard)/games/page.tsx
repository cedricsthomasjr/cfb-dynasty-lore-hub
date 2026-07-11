import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Game Center" };

export default function GamesPage() {
  return (
    <PagePlaceholder
      title="Game Center"
      description="Box scores, team and player stats, recaps, and previews."
      phase="Phase 3"
      bullets={[
        "Final scores and box scores",
        "Per-player game statistics",
        "AI recaps and previews per game",
      ]}
    />
  );
}
