import { NextResponse } from "next/server";
import { allDomains, domainMeta } from "@/lib/ingestion/domains";

export const runtime = "nodejs";

/**
 * GET /api/upload/domains
 * Public metadata for every registered upload domain — the contract the upload
 * UI (and future per-domain upload pages) build against without importing the
 * server-only registry.
 */
export async function GET() {
  const domains = allDomains().map(domainMeta);
  return NextResponse.json({ domains }, { status: 200 });
}
