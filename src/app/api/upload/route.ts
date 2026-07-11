import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { InputMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { ACCEPTED_UPLOAD_MIME, maxUploadBytes } from "@/lib/constants";
import { processUpload } from "@/lib/ingestion/pipeline";
import {
  resolveUploadRequest,
  UploadRequestError,
} from "@/lib/ingestion/upload-request";

export const runtime = "nodejs";
// Manual uploads are processed inline; that path is cheap (no vision).
export const maxDuration = 60;

/**
 * POST /api/upload — unified ingestion entrypoint (two axes: domain × method).
 *
 * - multipart/form-data → SCREENSHOT: store the image + an Upload row, then let
 *   the client kick off /api/uploads/[id]/process (domain-aware) as before.
 *   Fields: file, domain, dynastyId, teamId?
 * - application/json → MANUAL: validate the typed payload against the domain's
 *   Zod schema and stage it directly (no vision), returning the staging result.
 *   Body: { domain, inputMethod: "MANUAL", dynastyId, teamId?, payload }
 *
 * Both require a domain and enforce the team-binding rules (see
 * resolveUploadRequest). Idempotent by SHA-256 content hash.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return await handleManual(req);
    }
    return await handleScreenshot(req);
  } catch (err) {
    if (err instanceof UploadRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleScreenshot(req: NextRequest): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field." }, { status: 400 });
  }

  const resolved = await resolveUploadRequest({
    domain: form.get("domain"),
    inputMethod: InputMethod.SCREENSHOT,
    dynastyId: form.get("dynastyId"),
    teamId: form.get("teamId"),
  });

  const mimeType = file.type;
  if (!ACCEPTED_UPLOAD_MIME.includes(mimeType as never)) {
    return NextResponse.json(
      {
        error: `Unsupported file type '${mimeType || "unknown"}'. Accepted: ${ACCEPTED_UPLOAD_MIME.join(", ")}.`,
      },
      { status: 415 }
    );
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    return NextResponse.json(
      { error: `File exceeds max size of ${limit} bytes.` },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(bytes).digest("hex");

  const existing = await prisma.upload.findUnique({ where: { contentHash } });
  if (existing) {
    return NextResponse.json({ upload: existing, duplicate: true }, { status: 200 });
  }

  const stored = await getStorage().put({
    bytes,
    originalName: file.name || "screenshot",
    mimeType,
  });

  const upload = await prisma.upload.create({
    data: {
      dynastyId: resolved.dynastyId,
      userId: resolved.user.id,
      teamId: resolved.teamId,
      domain: resolved.domain,
      inputMethod: InputMethod.SCREENSHOT,
      originalName: file.name || "screenshot",
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      mimeType,
      sizeBytes: stored.sizeBytes,
      contentHash: stored.contentHash,
      // screenType + status default to UNKNOWN / UPLOADED; processing routes by domain.
    },
  });

  return NextResponse.json({ upload, duplicate: false }, { status: 201 });
}

async function handleManual(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const resolved = await resolveUploadRequest({
    domain: body.domain,
    inputMethod: InputMethod.MANUAL,
    dynastyId: body.dynastyId,
    teamId: body.teamId,
  });

  // Validate the payload up front so bad input is a clean 400 (not a 500 later).
  const parsed = resolved.handler.manualSchema!.safeParse(body.payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid manual payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Idempotency for manual input: hash domain + team + canonical payload.
  const canonical = canonicalJson(parsed.data);
  const contentHash = createHash("sha256")
    .update(`${resolved.domain}:${resolved.teamId ?? ""}:${canonical}`)
    .digest("hex");

  const existing = await prisma.upload.findUnique({ where: { contentHash } });
  if (existing) {
    return NextResponse.json({ upload: existing, duplicate: true }, { status: 200 });
  }

  const upload = await prisma.upload.create({
    data: {
      dynastyId: resolved.dynastyId,
      userId: resolved.user.id,
      teamId: resolved.teamId,
      domain: resolved.domain,
      inputMethod: InputMethod.MANUAL,
      originalName: `${resolved.domain.toLowerCase()}.json`,
      storageKey: `manual:${contentHash}`,
      publicUrl: null,
      mimeType: "application/json",
      sizeBytes: Buffer.byteLength(canonical),
      contentHash,
      manualPayload: parsed.data as Prisma.InputJsonValue,
    },
  });

  const result = await processUpload(upload.id);
  return NextResponse.json({ upload, result, duplicate: false }, { status: 201 });
}

/** Deterministic JSON (sorted keys) so equivalent payloads hash identically. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return value;
}
