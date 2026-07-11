import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getActiveDynasty } from "@/lib/dynasty/active";

export const metadata = { title: "Conference Standings" };
export const dynamic = "force-dynamic";

const DESCRIPTION = "Conference and overall records for every team, by week.";

export default async function StandingsPage() {
  const active = await getActiveDynasty();

  if (!active) {
    return (
      <div>
        <PageHeader title="Conference Standings" description={DESCRIPTION} />
        <EmptyState
          title="No dynasty yet"
          hint="Create a dynasty and promote a conference standings screenshot."
        />
      </div>
    );
  }

  // Most recent snapshot per conference (newest capturedAt wins).
  const snapshots = await prisma.conferenceStandingSnapshot.findMany({
    where: { season: { dynastyId: active.dynasty.id } },
    orderBy: { capturedAt: "desc" },
    include: {
      conference: true,
      season: true,
      entries: {
        orderBy: [{ confWins: "desc" }, { overallWins: "desc" }],
        include: { team: true },
      },
    },
  });

  const latestByConference = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!latestByConference.has(s.conferenceId)) latestByConference.set(s.conferenceId, s);
  }
  const boards = [...latestByConference.values()];

  return (
    <div>
      <PageHeader title="Conference Standings" description={DESCRIPTION} />
      {boards.length === 0 ? (
        <EmptyState
          title="No standings promoted yet"
          hint="Upload a conference standings screenshot, approve the entries, then validate to promote them here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{board.conference.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {board.season.year}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Team</th>
                        <th className="px-3 py-2 text-right font-medium">Conf</th>
                        <th className="px-3 py-2 text-right font-medium">Overall</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {board.entries.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{e.team.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {e.confWins}-{e.confLosses}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {e.overallWins}-{e.overallLosses}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
