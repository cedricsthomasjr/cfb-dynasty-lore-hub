import { GameStatus, WeekType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BootstrapError } from "./bootstrap";
import { WEEK_TEMPLATE, type WeekTypeName } from "./schedule-weeks";

/**
 * Schedule bootstrap. Like createDynasty/setControlledTeam, this is user-authored
 * structural data (which teams play which week) — NOT AI-parsed stats — so it
 * writes canonical rows directly instead of going through the staging→promotion
 * pipeline. Games are created SCHEDULED with no scores; results still only ever
 * arrive via a promoted box score, so the DB-is-truth invariant holds.
 *
 * The week template + labels live in ./schedule-weeks (client-safe, no Prisma).
 */

export interface ScheduleEntry {
  weekNumber: number; // a REGULAR week number
  opponentTeamId: string;
  isHome: boolean; // true = vs (home), false = @ (away)
}

export interface CreateScheduleInput {
  dynastyId: string;
  teamId: string; // the caller's controlled team
  year: number;
  entries: ScheduleEntry[];
  currentWeekNumber: number;
  currentWeekType: WeekTypeName;
}

/**
 * Create (or top up) the season's week structure, write the controlled team's
 * SCHEDULED games, and set the dynasty's current week. Idempotent on the season
 * and weeks (upsert); a re-run replaces the controlled team's game in a week
 * rather than duplicating it.
 */
export async function createSchedule(
  input: CreateScheduleInput
): Promise<{ seasonId: string; gamesWritten: number }> {
  const { dynastyId, teamId, year, entries } = input;

  if (!Number.isInteger(year)) {
    throw new BootstrapError("A valid season year is required.");
  }

  return prisma.$transaction(async (tx) => {
    const season = await tx.season.upsert({
      where: { dynastyId_year: { dynastyId, year } },
      update: {},
      create: { dynastyId, year, label: `${year} Season` },
    });

    // Generate the standard week structure (idempotent).
    for (const w of WEEK_TEMPLATE) {
      await tx.week.upsert({
        where: {
          seasonId_number_type: {
            seasonId: season.id,
            number: w.number,
            type: w.type,
          },
        },
        update: {},
        create: { seasonId: season.id, number: w.number, type: w.type },
      });
    }

    const regularWeeks = await tx.week.findMany({
      where: { seasonId: season.id, type: WeekType.REGULAR },
    });
    const weekIdByNumber = new Map(regularWeeks.map((w) => [w.number, w.id]));

    let gamesWritten = 0;
    for (const entry of entries) {
      const weekId = weekIdByNumber.get(entry.weekNumber);
      if (!weekId) continue;
      if (entry.opponentTeamId === teamId) {
        throw new BootstrapError("A team cannot be scheduled against itself.");
      }

      const homeTeamId = entry.isHome ? teamId : entry.opponentTeamId;
      const awayTeamId = entry.isHome ? entry.opponentTeamId : teamId;

      // One game per (controlled team, week): replace if it already exists.
      const existing = await tx.game.findFirst({
        where: {
          seasonId: season.id,
          weekId,
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        },
      });
      if (existing) {
        await tx.game.update({
          where: { id: existing.id },
          data: { homeTeamId, awayTeamId },
        });
      } else {
        await tx.game.create({
          data: {
            seasonId: season.id,
            weekId,
            homeTeamId,
            awayTeamId,
            status: GameStatus.SCHEDULED,
          },
        });
      }
      gamesWritten += 1;
    }

    const currentWeek = await tx.week.findUnique({
      where: {
        seasonId_number_type: {
          seasonId: season.id,
          number: input.currentWeekNumber,
          type: input.currentWeekType,
        },
      },
    });
    await tx.dynasty.update({
      where: { id: dynastyId },
      data: { currentWeekId: currentWeek?.id ?? null },
    });

    return { seasonId: season.id, gamesWritten };
  });
}
