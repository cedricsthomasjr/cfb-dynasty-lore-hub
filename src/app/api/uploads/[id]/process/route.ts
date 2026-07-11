import { NextRequest, NextResponse } from "next/server";
import { processUpload } from "@/lib/ingestion/pipeline";

export const runtime = "nodejs";
// Vision calls can take several seconds; give the route room.
export const maxDuration = 60;

/**
 * POST /api/uploads/[id]/process
 * Runs the domain-aware ingestion pipeline for one upload. Screenshot uploads
 * detect (or skip detection when the domain pins a screen type) then parse;
 * manual uploads validate their payload and stage it directly — the pipeline
 * dispatches on the upload's inputMethod/domain. Pass { force: true } to re-run.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let force = false;
  try {
    const body = await req.json();
    force = Boolean(body?.force);
  } catch {
    // no body -> default force=false
  }

  try {
    const result = await processUpload(params.id, { force });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
