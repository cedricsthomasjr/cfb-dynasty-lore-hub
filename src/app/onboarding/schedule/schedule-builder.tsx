"use client";

import { useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  AlertCircle,
  Home,
  Plane,
  UploadCloud,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  createScheduleAction,
  type DynastyActionState,
} from "@/lib/dynasty/actions";
import {
  REGULAR_WEEK_NUMBERS,
  WEEK_TEMPLATE,
  weekLabel,
  type WeekTypeName,
} from "@/lib/dynasty/schedule-weeks";
import { cn } from "@/lib/utils";

interface Opponent {
  id: string;
  name: string;
}

interface Row {
  opponentId: string; // "" = bye
  isHome: boolean;
}

const INPUT_CLASS =
  "rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50";
const initial: DynastyActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "Saving schedule…" : "Save schedule & continue"}
    </button>
  );
}

export function ScheduleBuilder({
  dynastyId,
  teamName,
  opponents,
  defaultYear,
}: {
  dynastyId: string;
  teamName: string;
  opponents: Opponent[];
  defaultYear: number;
}) {
  const [state, formAction] = useFormState(createScheduleAction, initial);
  const [year, setYear] = useState(defaultYear);
  const [currentWeekKey, setCurrentWeekKey] = useState("REGULAR:0");
  const [rows, setRows] = useState<Record<number, Row>>({});

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);

  async function importScreenshot(file: File) {
    setImporting(true);
    setImportError(null);
    setImportInfo(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/dynasties/${dynastyId}/schedule/parse`, {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setImportError(json.error ?? "Could not read that screenshot.");
        return;
      }
      const entries: {
        weekNumber: number;
        opponentTeamId: string | null;
        isHome: boolean;
      }[] = json.entries ?? [];

      setRows((prev) => {
        const next = { ...prev };
        for (const e of entries) {
          if (e.opponentTeamId) {
            next[e.weekNumber] = { opponentId: e.opponentTeamId, isHome: e.isHome };
          }
        }
        return next;
      });
      if (typeof json.seasonYear === "number") setYear(json.seasonYear);

      const matched = entries.filter((e) => e.opponentTeamId).length;
      const unmatched = entries.length - matched;
      setImportInfo(
        `Imported ${matched} matchup${matched === 1 ? "" : "s"}` +
          (unmatched
            ? ` · ${unmatched} opponent${unmatched === 1 ? "" : "s"} not matched — set ${unmatched === 1 ? "it" : "them"} below`
            : "") +
          ". Review below, then save."
      );
    } catch {
      setImportError("Network error reading the screenshot.");
    } finally {
      setImporting(false);
    }
  }

  const payload = useMemo(() => {
    const [type, number] = currentWeekKey.split(":");
    const entries = REGULAR_WEEK_NUMBERS.flatMap((weekNumber) => {
      const row = rows[weekNumber];
      if (!row?.opponentId) return [];
      return [
        {
          weekNumber,
          opponentTeamId: row.opponentId,
          isHome: row.isHome,
        },
      ];
    });
    return JSON.stringify({
      year,
      currentWeekNumber: Number(number),
      currentWeekType: type as WeekTypeName,
      entries,
    });
  }, [year, currentWeekKey, rows]);

  const gameCount = Object.values(rows).filter((r) => r.opponentId).length;

  function setRow(week: number, patch: Partial<Row>) {
    setRows((prev) => {
      const base: Row = prev[week] ?? { opponentId: "", isHome: true };
      return { ...prev, [week]: { ...base, ...patch } };
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="dynastyId" value={dynastyId} />
      <input type="hidden" name="payload" value={payload} />

      {/* Season + current week */}
      <div className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Season year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={cn(INPUT_CLASS, "w-full")}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Which week are you on now?</span>
          <select
            value={currentWeekKey}
            onChange={(e) => setCurrentWeekKey(e.target.value)}
            className={cn(INPUT_CLASS, "w-full")}
          >
            {WEEK_TEMPLATE.map((w) => (
              <option key={`${w.type}:${w.number}`} value={`${w.type}:${w.number}`}>
                {weekLabel(w.number, w.type)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Import from a screenshot */}
      <div className="rounded-lg border border-dashed bg-secondary/30 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {importing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Import from a screenshot</p>
            <p className="text-xs text-muted-foreground">
              Upload your in-game schedule — we read each week&apos;s opponent
              (“@” = away, “vs” = home) and fill it in below for you to confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {importing ? "Reading…" : "Upload screenshot"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importScreenshot(f);
              e.target.value = "";
            }}
          />
        </div>
        {importError ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {importError}
          </p>
        ) : null}
        {importInfo ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {importInfo}
          </p>
        ) : null}
      </div>

      {/* Weekly matchups */}
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">{teamName} · regular season</p>
          <p className="text-xs text-muted-foreground">
            {gameCount} game{gameCount === 1 ? "" : "s"} scheduled
          </p>
        </div>
        <ul className="divide-y">
          {REGULAR_WEEK_NUMBERS.map((week) => {
            const row = rows[week] ?? { opponentId: "", isHome: true };
            const hasOpponent = Boolean(row.opponentId);
            return (
              <li
                key={week}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              >
                <span className="w-16 shrink-0 text-sm font-medium">
                  Week {week}
                </span>

                <button
                  type="button"
                  onClick={() => setRow(week, { isHome: !row.isHome })}
                  disabled={!hasOpponent}
                  title={row.isHome ? "Home (vs)" : "Away (@)"}
                  className={cn(
                    "inline-flex w-16 shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                    hasOpponent && row.isHome && "border-primary/40 text-primary",
                    hasOpponent && !row.isHome && "border-amber-500/40 text-amber-600"
                  )}
                >
                  {row.isHome ? (
                    <>
                      <Home className="h-3 w-3" /> vs
                    </>
                  ) : (
                    <>
                      <Plane className="h-3 w-3" /> @
                    </>
                  )}
                </button>

                <select
                  value={row.opponentId}
                  onChange={(e) => setRow(week, { opponentId: e.target.value })}
                  className={cn(INPUT_CLASS, "min-w-0 flex-1")}
                >
                  <option value="">— Bye / no game —</option>
                  {opponents.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Only matchups are set here — scores stay empty until you upload a box
          score. Leave a week on “Bye” to skip it.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
