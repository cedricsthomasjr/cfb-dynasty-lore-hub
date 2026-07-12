"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  nickname: string | null;
  abbreviation: string | null;
  isCustom: boolean;
  isUserControlled: boolean;
  conference: { name: string } | null;
}

type Mode = "catalog" | "custom";

const INPUT_CLASS =
  "w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50";

export function TeamSelection({ dynastyId }: { dynastyId: string }) {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("catalog");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [custom, setCustom] = useState({
    name: "",
    nickname: "",
    abbreviation: "",
    primaryColor: "",
    secondaryColor: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load every team in the dynasty (seeded catalog + custom).
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/dynasties/${dynastyId}/teams`);
        const json = await res.json();
        if (!res.ok) {
          setLoadError(json.error ?? "Could not load teams.");
          return;
        }
        setTeams(json.teams ?? []);
      } catch {
        setLoadError("Network error while loading teams.");
      } finally {
        setLoading(false);
      }
    })();
  }, [dynastyId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.nickname?.toLowerCase().includes(q) ||
        t.abbreviation?.toLowerCase().includes(q) ||
        t.conference?.name.toLowerCase().includes(q)
    );
  }, [teams, query]);

  async function submit(url: string, body: unknown) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        // Covers 409 (team already controlled / duplicate custom name), plus
        // 400/404 — the API always returns { error: message }.
        setError(json.error ?? "Could not set your team.");
        setSubmitting(false);
        return;
      }
      // controlledTeamId is now set → build the schedule next.
      router.push("/onboarding/schedule");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function pickCatalog() {
    if (!selectedId) return;
    void submit(`/api/dynasties/${dynastyId}/controlled-team`, {
      teamId: selectedId,
    });
  }

  function createCustom() {
    const name = custom.name.trim();
    if (!name) return;
    void submit(`/api/dynasties/${dynastyId}/controlled-team/custom`, {
      name,
      nickname: custom.nickname.trim() || null,
      abbreviation: custom.abbreviation.trim() || null,
      primaryColor: custom.primaryColor.trim() || null,
      secondaryColor: custom.secondaryColor.trim() || null,
    });
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("catalog")}
          disabled={submitting}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "catalog"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Pick a team
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          disabled={submitting}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "custom"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Create custom
        </button>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {mode === "catalog" ? (
        <Card>
          <CardContent className="space-y-4 py-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams, conferences…"
                disabled={loading || submitting}
                className={cn(INPUT_CLASS, "pl-9")}
              />
            </label>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading teams…
              </div>
            ) : loadError ? (
              <div className="flex items-center gap-3 py-6 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {loadError}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No teams match “{query}”.
              </p>
            ) : (
              <ul className="max-h-96 divide-y overflow-y-auto rounded-md border">
                {filtered.map((team) => {
                  const taken = team.isUserControlled;
                  const selected = team.id === selectedId;
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(team.id)}
                        disabled={taken || submitting}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                          selected && "bg-primary/10",
                          taken
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-secondary/60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{team.name}</span>
                          {team.nickname ? (
                            <span className="text-muted-foreground">
                              {" "}
                              {team.nickname}
                            </span>
                          ) : null}
                        </span>
                        {team.conference ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {team.conference.name}
                          </span>
                        ) : null}
                        {team.isCustom ? (
                          <Badge variant="secondary">Custom</Badge>
                        ) : null}
                        {taken ? <Badge variant="secondary">Taken</Badge> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex justify-end">
              <Button
                onClick={pickCatalog}
                disabled={!selectedId || submitting || loading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting team…
                  </>
                ) : (
                  "Confirm team"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium">Team name</span>
                <input
                  type="text"
                  value={custom.name}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="Gridiron State"
                  disabled={submitting}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Nickname</span>
                <input
                  type="text"
                  value={custom.nickname}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, nickname: e.target.value }))
                  }
                  placeholder="Miners"
                  disabled={submitting}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Abbreviation</span>
                <input
                  type="text"
                  value={custom.abbreviation}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, abbreviation: e.target.value }))
                  }
                  placeholder="GDS"
                  maxLength={5}
                  disabled={submitting}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Primary color</span>
                <input
                  type="text"
                  value={custom.primaryColor}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, primaryColor: e.target.value }))
                  }
                  placeholder="#0A2540"
                  disabled={submitting}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Secondary color</span>
                <input
                  type="text"
                  value={custom.secondaryColor}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, secondaryColor: e.target.value }))
                  }
                  placeholder="#C0A062"
                  disabled={submitting}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Only a name is required. A custom program lives in this dynasty
              only — use it for a relocated school or a non-FBS opponent.
            </p>
            <div className="flex justify-end">
              <Button
                onClick={createCustom}
                disabled={!custom.name.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create & confirm"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
