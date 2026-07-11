"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatBytes } from "@/lib/utils";

interface Uploaded {
  name: string;
  size: number;
  duplicate: boolean;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | ({ status: "processing" } & Uploaded)
  | ({
      status: "done";
      screenType: string;
      detectionConfidence: number | null;
      entityCount?: number;
      message?: string;
    } & Uploaded)
  | { status: "error"; message: string };

const ACCEPT = "image/png,image/jpeg,image/webp";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setState({ status: "uploading" });
    let uploaded: Uploaded;
    let uploadId: string;
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Upload failed." });
        return;
      }
      uploaded = {
        name: json.upload.originalName,
        size: json.upload.sizeBytes,
        duplicate: Boolean(json.duplicate),
      };
      uploadId = json.upload.id;
    } catch {
      setState({ status: "error", message: "Network error during upload." });
      return;
    }

    // Kick off detection + parsing (Phase 2 pipeline).
    setState({ status: "processing", ...uploaded });
    try {
      const res = await fetch(`/api/uploads/${uploadId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: uploaded.duplicate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          message: json.error ?? "Processing failed.",
        });
        return;
      }
      setState({
        status: "done",
        ...uploaded,
        screenType: json.screenType,
        detectionConfidence: json.detectionConfidence,
        entityCount: json.entityCount,
        message: json.message,
      });
    } catch {
      setState({ status: "error", message: "Network error during processing." });
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  const busy = state.status === "uploading" || state.status === "processing";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Upload Screenshot"
        description="Add a College Football 25 screenshot. It is stored, then the screen is detected and parsed into structured data awaiting your review."
      />

      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          dragOver && "border-primary bg-primary/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </span>
          <div className="space-y-1">
            <p className="font-medium">
              Drag & drop a screenshot, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPEG, or WebP · up to 10&nbsp;MB
            </p>
          </div>
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            {state.status === "uploading"
              ? "Uploading…"
              : state.status === "processing"
                ? "Analyzing…"
                : "Choose file"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {state.status === "processing" && (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{state.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(state.size)} · detecting screen and parsing data…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "done" && (
        <Card className="mt-4 border-primary/40">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{state.name}</p>
                <p className="text-sm text-muted-foreground">
                  Detected <strong>{state.screenType}</strong>
                  {state.detectionConfidence != null
                    ? ` · ${Math.round(state.detectionConfidence * 100)}% confidence`
                    : ""}
                  {typeof state.entityCount === "number"
                    ? ` · ${state.entityCount} entities extracted`
                    : ""}
                </p>
              </div>
              {state.duplicate ? (
                <Badge variant="secondary">Re-processed</Badge>
              ) : (
                <Badge>Parsed</Badge>
              )}
            </div>
            {state.message ? (
              <p className="text-sm text-muted-foreground">{state.message}</p>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/review">
                Review extracted data
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {state.status === "error" && (
        <Card className="mt-4 border-destructive/40">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm">{state.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
