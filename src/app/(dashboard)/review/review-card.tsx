"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ENTITY_REVIEW_THRESHOLD } from "@/lib/ingestion/confidence";

export interface ReviewEntity {
  id: string;
  entityType: string;
  confidence: number;
  isValidated: boolean;
  payload: unknown;
}

export interface ReviewUpload {
  id: string;
  originalName: string;
  publicUrl: string | null;
  screenType: string;
  status: string;
  detectionConfidence: number | null;
  parseConfidence: number | null;
  entities: ReviewEntity[];
}

function pct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function summarize(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const entries = Object.entries(payload as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`);
    return entries.join(" · ");
  }
  return String(payload);
}

export function ReviewCard({ upload }: { upload: ReviewUpload }) {
  const router = useRouter();
  const [entities, setEntities] = useState(upload.entities);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(entityId: string, action: "approve" | "reject") {
    setBusy(entityId);
    try {
      const res = await fetch(`/api/entities/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      setEntities((prev) =>
        action === "reject"
          ? prev.filter((e) => e.id !== entityId)
          : prev.map((e) =>
              e.id === entityId ? { ...e, isValidated: true } : e
            )
      );
    } finally {
      setBusy(null);
    }
  }

  async function reprocess() {
    setBusy("reprocess");
    try {
      await fetch(`/api/uploads/${upload.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function validate() {
    setBusy("validate");
    try {
      await fetch(`/api/uploads/${upload.id}/validate`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const approvedCount = entities.filter((e) => e.isValidated).length;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-4">
          {upload.publicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={upload.publicUrl}
              alt={upload.originalName}
              className="h-16 w-16 rounded-md border object-cover"
            />
          ) : null}
          <div className="space-y-1">
            <p className="font-medium">{upload.originalName}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{upload.screenType}</Badge>
              <span>detect {pct(upload.detectionConfidence)}</span>
              <span>·</span>
              <span>parse {pct(upload.parseConfidence)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={upload.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        {entities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No extracted entities. Re-process to try again.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {entities.map((e) => {
              const low = e.confidence < ENTITY_REVIEW_THRESHOLD;
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.entityType}</span>
                      <Badge
                        variant={low ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {pct(e.confidence)}
                      </Badge>
                      {e.isValidated ? (
                        <Badge className="text-[10px]">approved</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-muted-foreground">
                      {summarize(e.payload)}
                    </p>
                  </div>
                  {!e.isValidated ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={busy === e.id}
                        onClick={() => act(e.id, "approve")}
                        aria-label="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={busy === e.id}
                        onClick={() => act(e.id, "reject")}
                        aria-label="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {approvedCount}/{entities.length} approved
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reprocess}
              disabled={busy === "reprocess"}
            >
              {busy === "reprocess" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-process
            </Button>
            <Button
              size="sm"
              onClick={validate}
              disabled={busy === "validate" || approvedCount === 0}
            >
              {busy === "validate" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Mark validated
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "VALIDATED"
      ? "default"
      : status === "FAILED"
        ? "destructive"
        : "secondary";
  return (
    <Badge variant={variant} className={cn("shrink-0")}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
