import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  setControlledTeamCustom,
  BootstrapError,
  type CustomTeamInput,
} from "@/lib/dynasty/bootstrap";

export const runtime = "nodejs";

/**
 * POST /api/dynasties/[id]/controlled-team/custom
 * Create a custom team AND set it as the current user's controlled team.
 * Body: { name, nickname?, abbreviation?, primaryColor?, secondaryColor? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: Partial<CustomTeamInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const user = await getCurrentUser();
  try {
    const result = await setControlledTeamCustom({
      dynastyId: params.id,
      userId: user.id,
      custom: {
        name: body.name,
        nickname: body.nickname ?? null,
        abbreviation: body.abbreviation ?? null,
        primaryColor: body.primaryColor ?? null,
        secondaryColor: body.secondaryColor ?? null,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof BootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
