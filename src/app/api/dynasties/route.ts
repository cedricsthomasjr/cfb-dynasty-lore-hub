import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createDynasty, BootstrapError } from "@/lib/dynasty/bootstrap";

export const runtime = "nodejs";

/**
 * GET /api/dynasties
 * Dynasties the current (stub) user belongs to, with their controlled team.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const memberships = await prisma.dynastyMembership.findMany({
    where: { userId: user.id },
    include: { dynasty: true, controlledTeam: true },
    orderBy: { createdAt: "desc" },
  });

  const dynasties = memberships.map((m) => ({
    id: m.dynastyId,
    name: m.dynasty.name,
    controlledTeam: m.controlledTeam
      ? { id: m.controlledTeam.id, name: m.controlledTeam.name }
      : null,
  }));

  return NextResponse.json({ dynasties }, { status: 200 });
}

/**
 * POST /api/dynasties
 * Create a dynasty and seed every TeamCatalog row into a dynasty-scoped Team.
 * Body: { name }
 */
export async function POST(req: NextRequest) {
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  try {
    const result = await createDynasty({ name: body.name, userId: user.id });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof BootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
