import { WeekType, type Prisma } from "@prisma/client";
import type { PromotionContext } from "./types";
import { PromotionSkip } from "./types";

/**
 * Find-or-create helpers that map extracted names/years to canonical rows. All
 * run inside the promotion transaction (ctx.tx). Teams/conferences created here
 * for a name not in the seeded catalog are marked custom so they're clearly
 * user/vision-originated rather than official FBS entries.
 */

export async function resolveSeason(
  ctx: PromotionContext,
  year: number | undefined
): Promise<string> {
  if (year == null) {
    throw new PromotionSkip("no season year on entity; cannot resolve Season.");
  }
  const cached = ctx.seasonCache.get(year);
  if (cached) return cached;

  const season = await ctx.tx.season.upsert({
    where: { dynastyId_year: { dynastyId: ctx.dynastyId, year } },
    update: {},
    create: { dynastyId: ctx.dynastyId, year, label: `${year} Season` },
  });
  ctx.seasonCache.set(year, season.id);
  return season.id;
}

export async function resolveWeek(
  tx: Prisma.TransactionClient,
  seasonId: string,
  number: number | undefined,
  type: WeekType = WeekType.REGULAR
): Promise<string | null> {
  if (number == null) return null;
  const week = await tx.week.upsert({
    where: { seasonId_number_type: { seasonId, number, type } },
    update: {},
    create: { seasonId, number, type },
  });
  return week.id;
}

export async function resolveTeam(
  ctx: PromotionContext,
  name: string
): Promise<string> {
  const team = await ctx.tx.team.upsert({
    where: { dynastyId_name: { dynastyId: ctx.dynastyId, name } },
    update: {},
    // A name not in the seeded catalog is treated as a custom team.
    create: { dynastyId: ctx.dynastyId, name, isCustom: true },
  });
  return team.id;
}

export async function resolveConference(
  ctx: PromotionContext,
  name: string
): Promise<string> {
  const conference = await ctx.tx.conference.upsert({
    where: { dynastyId_name: { dynastyId: ctx.dynastyId, name } },
    update: {},
    create: { dynastyId: ctx.dynastyId, name },
  });
  return conference.id;
}

export async function resolvePlayer(
  ctx: PromotionContext,
  input: { name: string; teamId: string | null }
): Promise<string> {
  // Player has no unique key on name, so find-or-create by (dynasty, team, name).
  const existing = await ctx.tx.player.findFirst({
    where: {
      dynastyId: ctx.dynastyId,
      teamId: input.teamId,
      name: input.name,
    },
  });
  if (existing) return existing.id;

  const created = await ctx.tx.player.create({
    data: {
      dynastyId: ctx.dynastyId,
      teamId: input.teamId,
      name: input.name,
      sourceUploadId: ctx.uploadId,
    },
  });
  return created.id;
}
