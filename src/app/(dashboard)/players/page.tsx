import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getActiveDynasty } from "@/lib/dynasty/active";

export const metadata = { title: "Players" };
export const dynamic = "force-dynamic";

const DESCRIPTION = "Players promoted from validated rosters and box scores.";

export default async function PlayersPage() {
  const active = await getActiveDynasty();

  if (!active) {
    return (
      <div>
        <PageHeader title="Players" description={DESCRIPTION} />
        <EmptyState
          title="No dynasty yet"
          hint="Create a dynasty and promote a roster to populate players."
        />
      </div>
    );
  }

  const players = await prisma.player.findMany({
    where: { dynastyId: active.dynasty.id },
    orderBy: [{ name: "asc" }],
    take: 200,
    include: { team: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Players"
        description={DESCRIPTION}
        action={<Badge variant="secondary">{players.length} players</Badge>}
      />
      {players.length === 0 ? (
        <EmptyState
          title="No players promoted yet"
          hint="Upload a PLAYER_ROSTER (manual or screenshot), approve it, then validate to promote players here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Player</th>
                <th className="px-4 py-2 font-medium">Pos</th>
                <th className="px-4 py-2 font-medium">Class</th>
                <th className="px-4 py-2 font-medium">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">
                    {p.jersey ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.position ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.classYear ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {p.team ? (
                      <Link
                        href={`/teams/${p.team.id}`}
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {p.team.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
