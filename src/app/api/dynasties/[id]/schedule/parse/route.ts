import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVision } from "@/lib/ai";
import { scheduleParser } from "@/lib/ingestion/parsers/schedule";
import { ACCEPTED_UPLOAD_MIME, maxUploadBytes } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * POST /api/dynasties/[id]/schedule/parse  (multipart: file)
 *
 * Reads a schedule screenshot with the vision parser and maps each opponent name
 * to a team in THIS dynasty, returning matchups for the onboarding builder to
 * pre-fill. This never writes anything — the user reviews the imported matchups
 * in the builder and only an explicit Save creates the (SCHEDULED) games. "@" is
 * away, "vs" is home.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const membership = await prisma.dynastyMembership.findUnique({
    where: { userId_dynastyId: { userId: user.id, dynastyId: params.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Dynasty not found." }, { status: 404 });
  }
  if (!membership.controlledTeamId) {
    return NextResponse.json(
      { error: "Pick your team before importing a schedule." },
      { status: 409 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A screenshot file is required." }, { status: 400 });
  }
  if (!ACCEPTED_UPLOAD_MIME.includes(file.type as never)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPEG, or WebP." },
      { status: 415 }
    );
  }
  if (file.size > maxUploadBytes()) {
    return NextResponse.json({ error: "Screenshot is too large." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await scheduleParser.parse({
      imageBase64: bytes.toString("base64"),
      mediaType: file.type,
      vision: getVision(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not read a schedule from that screenshot." },
      { status: 422 }
    );
  }

  const data = parsed.data as {
    seasonYear?: number;
    confidence?: number;
    games?: { week: number; opponent: string; homeAway: string }[];
  };

  // Resolve opponent names to teams in THIS dynasty (never invent teams — an
  // unmatched opponent is returned with a null id for the user to set manually).
  const teams = await prisma.team.findMany({
    where: { dynastyId: params.id },
    select: { id: true, name: true },
  });
  const byName = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));
  function resolve(name: string): string | null {
    const key = name.trim().toLowerCase();
    if (byName.has(key)) return byName.get(key)!;
    const partial = teams.find(
      (t) =>
        t.name.toLowerCase().includes(key) || key.includes(t.name.toLowerCase())
    );
    return partial ? partial.id : null;
  }

  const entries = (data.games ?? [])
    .filter((g) => g && g.opponent && Number.isInteger(g.week))
    .map((g) => {
      const opponentTeamId = resolve(g.opponent);
      return {
        weekNumber: g.week,
        opponentName: g.opponent,
        opponentTeamId:
          opponentTeamId && opponentTeamId !== membership.controlledTeamId
            ? opponentTeamId
            : null,
        isHome: g.homeAway !== "AWAY",
      };
    });

  return NextResponse.json({
    seasonYear: data.seasonYear ?? null,
    confidence: data.confidence ?? null,
    entries,
  });
}
