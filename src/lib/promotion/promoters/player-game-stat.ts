import type { Promoter, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import { resolveTeam, resolvePlayer } from "../resolve";
import { int, num, str } from "../field";

/**
 * PlayerGameStat entity — one player's stat line for a game. Attaches to the
 * game promoted earlier in the same upload (box score). Manual player-game-stats
 * without a game in the same upload can't be resolved yet and are skipped.
 */
export const playerGameStatPromoter: Promoter = {
  entityType: "PlayerGameStat",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const gameId = ctx.lastGameId;
    if (!gameId) {
      throw new PromotionSkip(
        "no game in this upload to attach the stat line to."
      );
    }

    const name = str(payload, "player", "name");
    if (!name) throw new PromotionSkip("PlayerGameStat missing player name.");

    const teamName = str(payload, "team");
    const teamId = teamName ? await resolveTeam(ctx, teamName) : ctx.teamId;
    const playerId = await resolvePlayer(ctx, { name, teamId });

    const data = {
      passComp: int(payload, "passComp") ?? null,
      passAtt: int(payload, "passAtt") ?? null,
      passYards: int(payload, "passYards") ?? null,
      passTd: int(payload, "passTd") ?? null,
      passInt: int(payload, "passInt") ?? null,
      rushAtt: int(payload, "rushAtt") ?? null,
      rushYards: int(payload, "rushYards") ?? null,
      rushTd: int(payload, "rushTd") ?? null,
      rec: int(payload, "rec") ?? null,
      recYards: int(payload, "recYards") ?? null,
      recTd: int(payload, "recTd") ?? null,
      tackles: int(payload, "tackles") ?? null,
      sacks: num(payload, "sacks") ?? null,
      defInt: int(payload, "defInt") ?? null,
      forcedFumbles: int(payload, "forcedFumbles") ?? null,
      fgMade: int(payload, "fgMade") ?? null,
      fgAtt: int(payload, "fgAtt") ?? null,
      sourceUploadId: ctx.uploadId,
    };

    const stat = await ctx.tx.playerGameStat.upsert({
      where: { gameId_playerId: { gameId, playerId } },
      update: data,
      create: { gameId, playerId, ...data },
    });
    return { canonicalType: "PlayerGameStat", canonicalId: stat.id };
  },
};
