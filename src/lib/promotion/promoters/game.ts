import { GameStatus } from "@prisma/client";
import type { Promoter, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import { resolveSeason, resolveWeek, resolveTeam } from "../resolve";
import { int, str } from "../field";

function gameStatusFrom(payload: Record<string, unknown>): GameStatus {
  const raw = (str(payload, "status") ?? "").toUpperCase();
  if (raw === "FINAL") return GameStatus.FINAL;
  if (raw === "IN_PROGRESS") return GameStatus.IN_PROGRESS;
  return GameStatus.SCHEDULED;
}

/**
 * Game entity (from a box score). No natural unique key, so find-or-create by
 * (season, week, home, away). Records its id on the context so player stat lines
 * promoted later in the same upload attach to it.
 */
export const gamePromoter: Promoter = {
  entityType: "Game",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const homeName = str(payload, "homeTeam");
    const awayName = str(payload, "awayTeam");
    if (!homeName || !awayName) {
      throw new PromotionSkip("Game missing home or away team.");
    }

    const seasonId = await resolveSeason(ctx, int(payload, "seasonYear"));
    const weekId = await resolveWeek(ctx.tx, seasonId, int(payload, "week"));
    const homeTeamId = await resolveTeam(ctx, homeName);
    const awayTeamId = await resolveTeam(ctx, awayName);

    const data = {
      homeScore: int(payload, "homeScore") ?? null,
      awayScore: int(payload, "awayScore") ?? null,
      status: gameStatusFrom(payload),
      sourceUploadId: ctx.uploadId,
    };

    const existing = await ctx.tx.game.findFirst({
      where: { seasonId, weekId, homeTeamId, awayTeamId },
    });
    const game = existing
      ? await ctx.tx.game.update({ where: { id: existing.id }, data })
      : await ctx.tx.game.create({
          data: { seasonId, weekId, homeTeamId, awayTeamId, ...data },
        });

    ctx.lastGameId = game.id;
    return { canonicalType: "Game", canonicalId: game.id };
  },
};
