import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setControlledTeam, BootstrapError } from "@/lib/dynasty/bootstrap";

export const runtime = "nodejs";

/**
 * POST /api/dynasties/[id]/controlled-team
 * Set the current user's controlled team to an existing (seeded or custom) team.
 * Body: { teamId }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { teamId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.teamId !== "string" || !body.teamId) {
    return NextResponse.json({ error: "teamId is required." }, { status: 400 });
  }

  const user = await getCurrentUser();
  try {
    const result = await setControlledTeam({
      dynastyId: params.id,
      userId: user.id,
      teamId: body.teamId,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof BootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
