import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      conference: { select: { name: true } },
      players: { orderBy: [{ jersey: "asc" }, { name: "asc" }] },
    },
  });
  if (!team) notFound();

  const games = await prisma.game.findMany({
    where: {
      OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
    },
    orderBy: [{ season: { year: "desc" } }],
    take: 10,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      season: { select: { year: true } },
      week: { select: { number: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All teams
      </Link>

      <div
        className="flex items-center gap-4 rounded-xl border p-5"
        style={{
          borderColor: team.primaryColor ?? undefined,
          background: team.primaryColor ? `${team.primaryColor}10` : undefined,
        }}
      >
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: team.primaryColor ?? "#334155" }}
        >
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            (team.abbreviation ?? team.name.slice(0, 3).toUpperCase())
          )}
        </span>
        <div className="min-w-0 flex-1">
          <PageHeader
            title={team.name}
            description={
              [team.nickname, team.conference?.name]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />
        </div>
        {team.isUserControlled ? <Badge>Your team</Badge> : null}
        {team.isCustom ? <Badge variant="outline">Custom</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Roster</span>
              <span className="text-xs font-normal text-muted-foreground">
                {team.players.length} players
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.players.length === 0 ? (
              <EmptyState
                title="No roster yet"
                hint="Promote a PLAYER_ROSTER upload for this team."
              />
            ) : (
              <ul className="divide-y rounded-lg border">
                {team.players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <span className="w-8 text-right tabular-nums text-muted-foreground">
                      {p.jersey ?? "—"}
                    </span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[p.position, p.classYear].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent games</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <EmptyState
                title="No games yet"
                hint="Promote a GAME_BOX_SCORE upload involving this team."
              />
            ) : (
              <ul className="divide-y rounded-lg border">
                {games.map((g) => {
                  const isHome = g.homeTeamId === team.id;
                  const opponent = isHome ? g.awayTeam.name : g.homeTeam.name;
                  const teamScore = isHome ? g.homeScore : g.awayScore;
                  const oppScore = isHome ? g.awayScore : g.homeScore;
                  const decided = teamScore != null && oppScore != null;
                  const won = decided && teamScore > oppScore;
                  return (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      {decided ? (
                        <span
                          className={
                            won
                              ? "w-5 font-bold text-emerald-600 dark:text-emerald-400"
                              : "w-5 font-bold text-red-600 dark:text-red-400"
                          }
                        >
                          {won ? "W" : "L"}
                        </span>
                      ) : (
                        <span className="w-5 text-muted-foreground">·</span>
                      )}
                      <span className="flex-1">
                        {isHome ? "vs" : "@"} {opponent}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {decided ? `${teamScore}–${oppScore}` : "—"}
                      </span>
                      <span className="w-16 text-right text-xs text-muted-foreground">
                        {g.season.year}
                        {g.week ? ` Wk ${g.week.number}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
