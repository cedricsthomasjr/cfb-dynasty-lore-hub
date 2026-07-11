import { PollType } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RankingTable } from "@/components/shared/ranking-table";
import { Badge } from "@/components/ui/badge";
import { getActiveDynasty } from "@/lib/dynasty/active";
import { latestRankingSnapshot } from "@/lib/reads/rankings";

export const metadata = { title: "CFP Rankings" };
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "The College Football Playoff committee picture as it develops each week.";

export default async function CfpPage() {
  const active = await getActiveDynasty();

  if (!active) {
    return (
      <div>
        <PageHeader title="CFP Rankings" description={DESCRIPTION} />
        <EmptyState
          title="No dynasty yet"
          hint="Create a dynasty and promote a CFP rankings screenshot to see the bracket picture."
        />
      </div>
    );
  }

  const snapshot = await latestRankingSnapshot(active.dynasty.id, [
    PollType.CFP,
    PollType.PLAYOFF_COMMITTEE,
  ]);

  return (
    <div>
      <PageHeader
        title="CFP Rankings"
        description={DESCRIPTION}
        action={
          snapshot ? (
            <Badge variant="secondary">
              {snapshot.season.year}
              {snapshot.week ? ` · Week ${snapshot.week.number}` : ""}
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
          title="No CFP rankings promoted yet"
          hint="Upload a CFP rankings screenshot, approve the entries, then validate to promote them here."
        />
      )}
    </div>
  );
}
