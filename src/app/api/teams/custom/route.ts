import { NextRequest, NextResponse } from "next/server";
import {
  addCustomTeam,
  BootstrapError,
  type CustomTeamInput,
} from "@/lib/dynasty/bootstrap";

export const runtime = "nodejs";

/**
 * POST /api/teams/custom
 * Add a custom (non-controlled) team to a dynasty — e.g. an opponent that isn't
 * in the FBS catalog. Does NOT change the caller's controlled team.
 * Body: { dynastyId, name, nickname?, abbreviation?, primaryColor?, secondaryColor? }
 */
export async function POST(req: NextRequest) {
  let body: Partial<CustomTeamInput> & { dynastyId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.dynastyId !== "string" || !body.dynastyId) {
    return NextResponse.json({ error: "dynastyId is required." }, { status: 400 });
  }
  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const team = await addCustomTeam({
      dynastyId: body.dynastyId,
      custom: {
        name: body.name,
        nickname: body.nickname ?? null,
        abbreviation: body.abbreviation ?? null,
        primaryColor: body.primaryColor ?? null,
        secondaryColor: body.secondaryColor ?? null,
      },
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    if (err instanceof BootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
