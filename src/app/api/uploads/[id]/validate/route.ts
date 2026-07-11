import { NextRequest, NextResponse } from "next/server";
import { UploadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { promoteUpload } from "@/lib/promotion";

export const runtime = "nodejs";

/**
 * POST /api/uploads/[id]/validate
 * Phase 3 canonical promotion. Promotes every human-approved ExtractedEntity of
 * this upload into canonical tables (idempotent), then marks the upload
 * VALIDATED. Requires at least one approved entity. Returns the promotion
 * summary so the reviewer sees exactly what was written or skipped.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const validatedCount = await prisma.extractedEntity.count({
    where: { isValidated: true, parseResult: { uploadId: params.id } },
  });

  if (validatedCount === 0) {
    return NextResponse.json(
      { error: "Approve at least one extracted entity before validating." },
      { status: 400 }
    );
  }

  let summary;
  try {
    summary = await promoteUpload(params.id);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Canonical promotion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const upload = await prisma.upload.update({
    where: { id: params.id },
    data: { status: UploadStatus.VALIDATED },
  });

  return NextResponse.json({ upload, promotion: summary }, { status: 200 });
}
