import { ClassYear } from "@prisma/client";
import type { Promoter, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import { resolvePlayer } from "../resolve";
import { int, str } from "../field";

function classYearFrom(payload: Record<string, unknown>): ClassYear | null {
  const raw = str(payload, "classYear");
  return raw && (Object.values(ClassYear) as string[]).includes(raw)
    ? (raw as ClassYear)
    : null;
}

/**
 * Player entity (from a roster upload). Bound to the upload's team (the
 * controlled team). Find-or-create by name within that team, then fill bio
 * attributes.
 */
export const playerPromoter: Promoter = {
  entityType: "Player",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const name = str(payload, "name");
    if (!name) throw new PromotionSkip("Player missing name.");

    const playerId = await resolvePlayer(ctx, { name, teamId: ctx.teamId });

    await ctx.tx.player.update({
      where: { id: playerId },
      data: {
        position: str(payload, "position") ?? null,
        jersey: int(payload, "jersey") ?? null,
        classYear: classYearFrom(payload),
        heightIn: int(payload, "heightIn") ?? null,
        weightLb: int(payload, "weightLb") ?? null,
        hometown: str(payload, "hometown") ?? null,
        sourceUploadId: ctx.uploadId,
      },
    });
    return { canonicalType: "Player", canonicalId: playerId };
  },
};
