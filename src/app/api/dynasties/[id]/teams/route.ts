import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dynasties/[id]/teams
 * All teams in a dynasty — seeded catalog teams and custom teams alike.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const dynasty = await prisma.dynasty.findUnique({ where: { id: params.id } });
  if (!dynasty) {
    return NextResponse.json({ error: "Dynasty not found." }, { status: 404 });
  }

  const teams = await prisma.team.findMany({
    where: { dynastyId: params.id },
    orderBy: [{ isCustom: "asc" }, { name: "asc" }],
    include: { conference: { select: { name: true } } },
  });

  return NextResponse.json({ teams }, { status: 200 });
}
