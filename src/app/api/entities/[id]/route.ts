import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * PATCH /api/entities/[id]
 * Human validation of a staged ExtractedEntity.
 *   { action: "approve" } -> mark validated (ready for canonical promotion)
 *   { action: "reject" }  -> remove the candidate from staging
 * Canonical promotion of approved entities is Phase 3.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let action: string | undefined;
  try {
    const body = await req.json();
    action = body?.action;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  if (action === "approve") {
    const entity = await prisma.extractedEntity.update({
      where: { id: params.id },
      data: { isValidated: true },
    });
    return NextResponse.json({ entity }, { status: 200 });
  }

  if (action === "reject") {
    await prisma.extractedEntity.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: params.id }, { status: 200 });
  }

  return NextResponse.json(
    { error: 'action must be "approve" or "reject".' },
    { status: 400 }
  );
}
