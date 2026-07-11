import { PollType } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RankingTable } from "@/components/shared/ranking-table";
import { Badge } from "@/components/ui/badge";
import { getActiveDynasty } from "@/lib/dynasty/active";
import { latestRankingSnapshot } from "@/lib/reads/rankings";

export const metadata = { title: "Top 25" };
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Weekly AP / Coaches poll snapshots with week-over-week movement.";

export default async function RankingsPage() {
  const active = await getActiveDynasty();

  if (!active) {
    return (
      <div>
        <PageHeader title="Top 25 Rankings" description={DESCRIPTION} />
        <EmptyState
          title="No dynasty yet"
          hint="Create a dynasty and promote a Top 25 screenshot to see rankings."
        />
      </div>
    );
  }

  const snapshot = await latestRankingSnapshot(active.dynasty.id, [
    PollType.AP,
    PollType.COACHES,
  ]);

  return (
    <div>
      <PageHeader
        title="Top 25 Rankings"
        description={DESCRIPTION}
        action={
          snapshot ? (
            <Badge variant="secondary">
              {snapshot.season.year}
              {snapshot.week ? ` · Week ${snapshot.week.number}` : ""} ·{" "}
              {snapshot.pollType}
            </Badge>
          ) : null
        }
      />
      {snapshot && snapshot.entries.length > 0 ? (
        <RankingTable
          rows={snapshot.entries.map((e) => ({
            rank: e.rank,
            teamName: e.team.name,
            record: e.record,
            previousRank: e.previousRank,
            points: e.points,
          }))}
        />
      ) : (
        <EmptyState
          title="No rankings promoted yet"
          hint="Upload a Top 25 screenshot, approve the entries in the review queue, then validate to promote them here."
        />
      )}
    </div>
  );
}
