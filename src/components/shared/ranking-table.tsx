import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RankingRow {
  rank: number;
  teamName: string;
  record: string | null;
  previousRank: number | null;
  points: number | null;
}

function Movement({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (previousRank == null) {
    return <span className="text-xs font-medium text-muted-foreground">NEW</span>;
  }
  const delta = previousRank - rank; // positive = moved up
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

/** Server-rendered ranking table shared by the Top 25 and CFP pages. */
export function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Rank</th>
            <th className="px-4 py-2 font-medium">Team</th>
            <th className="px-4 py-2 font-medium">Record</th>
            <th className="px-4 py-2 font-medium">Move</th>
            <th className="px-4 py-2 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.rank} className="hover:bg-muted/30">
              <td className="px-4 py-2 font-semibold tabular-nums">{r.rank}</td>
              <td className="px-4 py-2 font-medium">{r.teamName}</td>
              <td className="px-4 py-2 tabular-nums text-muted-foreground">
                {r.record ?? "—"}
              </td>
              <td className="px-4 py-2">
                <Movement rank={r.rank} previousRank={r.previousRank} />
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                {r.points ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
