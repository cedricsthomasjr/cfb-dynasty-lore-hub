import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { joinDynasty, BootstrapError } from "@/lib/dynasty/bootstrap";

export const runtime = "nodejs";

/**
 * POST /api/dynasties/[id]/join
 * Open join: create the current user's membership in this dynasty (no controlled
 * team yet). Idempotent. 404 if the dynasty doesn't exist.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const membership = await joinDynasty({
      dynastyId: params.id,
      userId: user.id,
    });
    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    if (err instanceof BootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
