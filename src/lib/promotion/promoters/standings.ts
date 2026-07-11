import type { Promoter, PromotionContext, PromotionOutcome } from "../types";
import { PromotionSkip } from "../types";
import {
  resolveSeason,
  resolveWeek,
  resolveTeam,
  resolveConference,
} from "../resolve";
import { int, str } from "../field";

/** Find-or-create the conference standings snapshot a row belongs to. */
async function resolveStandingSnapshot(
  ctx: PromotionContext,
  payload: Record<string, unknown>
): Promise<string> {
  const conferenceName = str(payload, "conference");
  if (!conferenceName) {
    throw new PromotionSkip("standings entity has no conference name.");
  }
  const seasonId = await resolveSeason(ctx, int(payload, "seasonYear"));
  const weekId = await resolveWeek(ctx.tx, seasonId, int(payload, "week"));
  const conferenceId = await resolveConference(ctx, conferenceName);

  const existing = await ctx.tx.conferenceStandingSnapshot.findFirst({
    where: { seasonId, weekId, conferenceId },
  });
  if (existing) return existing.id;

  const created = await ctx.tx.conferenceStandingSnapshot.create({
    data: { seasonId, weekId, conferenceId, sourceUploadId: ctx.uploadId },
  });
  return created.id;
}

/** ConferenceStandingSnapshot entity — the standings header. */
export const standingSnapshotPromoter: Promoter = {
  entityType: "ConferenceStandingSnapshot",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const id = await resolveStandingSnapshot(ctx, payload);
    return { canonicalType: "ConferenceStandingSnapshot", canonicalId: id };
  },
};

/** StandingEntry entity — one team's record within a standings snapshot. */
export const standingEntryPromoter: Promoter = {
  entityType: "StandingEntry",
  async promote(ctx, payload): Promise<PromotionOutcome> {
    const teamName = str(payload, "team");
    const confWins = int(payload, "confWins");
    const confLosses = int(payload, "confLosses");
    const overallWins = int(payload, "overallWins");
    const overallLosses = int(payload, "overallLosses");
    if (
      !teamName ||
      confWins == null ||
      confLosses == null ||
      overallWins == null ||
      overallLosses == null
    ) {
      throw new PromotionSkip("StandingEntry missing team or W/L fields.");
    }

    const snapshotId = await resolveStandingSnapshot(ctx, payload);
    const teamId = await resolveTeam(ctx, teamName);

    const data = {
      confWins,
      confLosses,
      overallWins,
      overallLosses,
      rank: int(payload, "rank") ?? null,
    };

    const entry = await ctx.tx.standingEntry.upsert({
      where: { snapshotId_teamId: { snapshotId, teamId } },
      update: data,
      create: { snapshotId, teamId, ...data },
    });
    return { canonicalType: "StandingEntry", canonicalId: entry.id };
  },
};
