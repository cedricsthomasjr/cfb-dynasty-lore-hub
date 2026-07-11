import { PollType } from "@prisma/client";
import type { Promoter, PromotionContext, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import { resolveSeason, resolveWeek, resolveTeam } from "../resolve";
import { int, str } from "../field";

/** "AP" | "COACHES" | "CFP" | ... -> PollType (defaults to AP). */
function pollTypeFrom(payload: Record<string, unknown>): PollType {
  const raw = (str(payload, "pollType") ?? "AP").toUpperCase();
  if (raw === "CFP" || raw === "PLAYOFF_COMMITTEE") return PollType.CFP;
  if (raw === "COACHES") return PollType.COACHES;
  return PollType.AP;
}

/** Find-or-create the snapshot a ranking row belongs to. */
async function resolveRankingSnapshot(
  ctx: PromotionContext,
  payload: Record<string, unknown>
): Promise<string> {
  const seasonId = await resolveSeason(ctx, int(payload, "seasonYear"));
  const weekId = await resolveWeek(ctx.tx, seasonId, int(payload, "week"));
  const pollType = pollTypeFrom(payload);

  const existing = await ctx.tx.rankingSnapshot.findFirst({
    where: { seasonId, weekId, pollType },
  });
  if (existing) return existing.id;

  const created = await ctx.tx.rankingSnapshot.create({
    data: { seasonId, weekId, pollType, sourceUploadId: ctx.uploadId },
  });
  return created.id;
}

/** RankingSnapshot entity — the poll header (no entries of its own). */
export const rankingSnapshotPromoter: Promoter = {
  entityType: "RankingSnapshot",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const id = await resolveRankingSnapshot(ctx, payload);
    return { canonicalType: "RankingSnapshot", canonicalId: id };
  },
};

/** RankingEntry entity — one ranked team within a snapshot. */
export const rankingEntryPromoter: Promoter = {
  entityType: "RankingEntry",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const rank = int(payload, "rank");
    const teamName = str(payload, "team");
    if (rank == null || !teamName) {
      throw new PromotionSkip("RankingEntry missing rank or team name.");
    }

    const snapshotId = await resolveRankingSnapshot(ctx, payload);
    const teamId = await resolveTeam(ctx, teamName);

    const data = {
      teamId,
      previousRank: int(payload, "previousRank") ?? null,
      record: str(payload, "record") ?? null,
      points: int(payload, "points") ?? null,
    };

    const entry = await ctx.tx.rankingEntry.upsert({
      where: { snapshotId_rank: { snapshotId, rank } },
      update: data,
      create: { snapshotId, rank, ...data },
    });
    return { canonicalType: "RankingEntry", canonicalId: entry.id };
  },
};
