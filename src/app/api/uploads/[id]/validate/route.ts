import { NextRequest, NextResponse } from "next/server";
import { UploadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/uploads/[id]/validate
 * Marks an upload's staged data as human-approved (status VALIDATED), i.e.
 * ready for canonical promotion in Phase 3. Requires at least one validated
 * entity.
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

  const upload = await prisma.upload.update({
    where: { id: params.id },
    data: { status: UploadStatus.VALIDATED },
  });

  return NextResponse.json({ upload }, { status: 200 });
}
