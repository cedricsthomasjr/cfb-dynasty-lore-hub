import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getActiveDynasty } from "@/lib/dynasty/active";

export const metadata = { title: "Teams" };
export const dynamic = "force-dynamic";

const DESCRIPTION = "Every program in the dynasty — records, rosters, and history.";

export default async function TeamsPage() {
  const active = await getActiveDynasty();

  if (!active) {
    return (
      <div>
        <PageHeader title="Teams" description={DESCRIPTION} />
        <EmptyState
          title="No dynasty yet"
          hint="Create a dynasty to seed all FBS teams from the catalog."
        />
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    where: { dynastyId: active.dynasty.id },
    orderBy: [{ name: "asc" }],
    include: { conference: { select: { name: true } } },
  });

  // Group by conference name (custom / unaffiliated teams last).
  const groups = new Map<string, typeof teams>();
  for (const t of teams) {
    const key = t.conference?.name ?? "Independent / Custom";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div>
      <PageHeader
        title="Teams"
        description={DESCRIPTION}
        action={<Badge variant="secondary">{teams.length} teams</Badge>}
      />
      {teams.length === 0 ? (
        <EmptyState title="No teams in this dynasty" />
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([conf, list]) => (
            <section key={conf}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {conf}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: t.primaryColor ?? "#334155" }}
                    >
                      {t.abbreviation ?? t.name.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.name}</span>
                      {t.nickname ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.nickname}
                        </span>
                      ) : null}
                    </span>
                    {t.isUserControlled ? (
                      <Badge className="shrink-0 text-[10px]">You</Badge>
                    ) : t.isCustom ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Custom
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
