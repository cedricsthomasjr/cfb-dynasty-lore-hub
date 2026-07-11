import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import {
  ACCEPTED_UPLOAD_MIME,
  maxUploadBytes,
} from "@/lib/constants";

export const runtime = "nodejs";

/**
 * POST /api/upload
 * Phase 1: accept a screenshot, validate it, store the bytes, and persist an
 * `Upload` row (status UPLOADED). No detection or parsing happens yet — those
 * arrive in Phase 2. Idempotent by SHA-256 content hash.
 */
export async function POST(req: NextRequest) {
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
    return NextResponse.json(
      { error: "Missing 'file' field." },
      { status: 400 }
    );
  }

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

  // Idempotency: identical screenshot already ingested -> return it, don't dup.
  const existing = await prisma.upload.findUnique({ where: { contentHash } });
  if (existing) {
    return NextResponse.json(
      { upload: existing, duplicate: true },
      { status: 200 }
    );
  }

  const stored = await getStorage().put({
    bytes,
    originalName: file.name || "screenshot",
    mimeType,
  });

  const upload = await prisma.upload.create({
    data: {
      originalName: file.name || "screenshot",
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      mimeType,
      sizeBytes: stored.sizeBytes,
      contentHash: stored.contentHash,
      // screenType + status default to UNKNOWN / UPLOADED; parsing is Phase 2.
    },
  });

  return NextResponse.json({ upload, duplicate: false }, { status: 201 });
}
