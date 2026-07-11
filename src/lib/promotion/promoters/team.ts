import type { Promoter, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import { str } from "../field";

/**
 * TeamLogo entity — promotes onto the controlled team's canonical logoUrl. This
 * is the Phase-3 write that Phase 2.5 deliberately deferred (manual TEAM_LOGO
 * only stages a TeamLogo candidate).
 */
export const teamLogoPromoter: Promoter = {
  entityType: "TeamLogo",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    if (!ctx.teamId) throw new PromotionSkip("TeamLogo has no target team.");
    const logoUrl = str(payload, "logoUrl");
    if (!logoUrl) throw new PromotionSkip("TeamLogo missing logoUrl.");

    await ctx.tx.team.update({
      where: { id: ctx.teamId },
      data: { logoUrl, sourceUploadId: ctx.uploadId },
    });
    return { canonicalType: "Team", canonicalId: ctx.teamId };
  },
};

/**
 * TeamIdentity entity — name / mascot / abbreviation / colors onto the
 * controlled team. Only fields present in the payload are written.
 */
export const teamIdentityPromoter: Promoter = {
  entityType: "TeamIdentity",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    if (!ctx.teamId) throw new PromotionSkip("TeamIdentity has no target team.");

    const data: Record<string, string> = {};
    const name = str(payload, "name");
    const nickname = str(payload, "nickname");
    const abbreviation = str(payload, "abbreviation");
    const primaryColor = str(payload, "primaryColor");
    const secondaryColor = str(payload, "secondaryColor");
    if (name) data.name = name;
    if (nickname) data.nickname = nickname;
    if (abbreviation) data.abbreviation = abbreviation;
    if (primaryColor) data.primaryColor = primaryColor;
    if (secondaryColor) data.secondaryColor = secondaryColor;

    if (Object.keys(data).length === 0) {
      throw new PromotionSkip("TeamIdentity has no fields to write.");
    }

    await ctx.tx.team.update({
      where: { id: ctx.teamId },
      data: { ...data, sourceUploadId: ctx.uploadId },
    });
    return { canonicalType: "Team", canonicalId: ctx.teamId };
  },
};
