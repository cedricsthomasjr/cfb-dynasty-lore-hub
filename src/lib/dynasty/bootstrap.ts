import { Prisma } from "@prisma/client";
import type { Dynasty, DynastyMembership, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Dynasty + team lifecycle. This is the one place that enforces the team model:
 *
 *   Catalog (TeamCatalog, global)  →  Team (per dynasty)  →  controlled team
 *                                                            (per user, one only)
 *
 * On dynasty creation every catalog row is copied into a dynasty-scoped Team.
 * A user controls exactly one Team per dynasty, tracked on DynastyMembership and
 * mirrored onto Team.isUserControlled. Two DB uniques back the invariants:
 *   @@unique([userId, dynastyId])          — one membership per user per dynasty
 *   @@unique([dynastyId, controlledTeamId]) — one controller per team
 */

export interface CustomTeamInput {
  name: string;
  nickname?: string | null;
  abbreviation?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export interface CreateDynastyResult {
  dynasty: Dynasty;
  teamCount: number;
  conferenceCount: number;
  membership: DynastyMembership;
}

/** Thrown for expected, user-facing failures so routes can map them to 4xx. */
export class BootstrapError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "BootstrapError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * Create a dynasty and seed it with the entire FBS catalog as dynasty-scoped
 * Team rows (one Conference per distinct catalog conference name). Also creates
 * the caller's membership with no controlled team yet (they pick one next).
 */
export async function createDynasty(input: {
  name: string;
  userId: string;
}): Promise<CreateDynastyResult> {
  const name = input.name.trim();
  if (!name) throw new BootstrapError("Dynasty name is required.");

  const catalog = await prisma.teamCatalog.findMany();
  if (catalog.length === 0) {
    throw new BootstrapError(
      "TeamCatalog is empty. Run `npm run db:seed` first.",
      500
    );
  }

  const conferenceNames = [
    ...new Set(
      catalog
        .map((c) => c.conferenceName)
        .filter((n): n is string => Boolean(n))
    ),
  ];

  return prisma.$transaction(async (tx) => {
    const dynasty = await tx.dynasty.create({ data: { name } });

    // One Conference per distinct catalog conference name.
    if (conferenceNames.length > 0) {
      await tx.conference.createMany({
        data: conferenceNames.map((cn) => ({ dynastyId: dynasty.id, name: cn })),
      });
    }
    const conferences = await tx.conference.findMany({
      where: { dynastyId: dynasty.id },
    });
    const conferenceIdByName = new Map(conferences.map((c) => [c.name, c.id]));

    // Copy every catalog row into a dynasty-scoped Team.
    await tx.team.createMany({
      data: catalog.map((c) => ({
        dynastyId: dynasty.id,
        catalogTeamId: c.id,
        conferenceId: c.conferenceName
          ? (conferenceIdByName.get(c.conferenceName) ?? null)
          : null,
        name: c.name,
        nickname: c.nickname,
        abbreviation: c.abbreviation,
        primaryColor: c.primaryColor,
        secondaryColor: c.secondaryColor,
        logoUrl: c.defaultLogoUrl,
        isCustom: false,
      })),
    });

    const membership = await tx.dynastyMembership.create({
      data: { userId: input.userId, dynastyId: dynasty.id },
    });

    return {
      dynasty,
      teamCount: catalog.length,
      conferenceCount: conferences.length,
      membership,
    };
  });
}

/**
 * Join an existing dynasty by id: create the caller's membership (no controlled
 * team yet). Open join — any signed-in user may join any dynasty by id; access
 * gating (invite codes) is a later concern. Idempotent via the membership
 * unique, so re-joining is a no-op.
 */
export async function joinDynasty(input: {
  dynastyId: string;
  userId: string;
}): Promise<DynastyMembership> {
  const dynasty = await prisma.dynasty.findUnique({
    where: { id: input.dynastyId },
  });
  if (!dynasty) throw new BootstrapError("Dynasty not found.", 404);

  return prisma.dynastyMembership.upsert({
    where: {
      userId_dynastyId: { userId: input.userId, dynastyId: input.dynastyId },
    },
    update: {},
    create: { userId: input.userId, dynastyId: input.dynastyId },
  });
}

/**
 * Point a user's membership at an existing dynasty Team, keeping
 * Team.isUserControlled in sync. Creates the membership if the user is joining a
 * dynasty they didn't create. Rejects a team already controlled by someone else.
 */
export async function setControlledTeam(input: {
  dynastyId: string;
  userId: string;
  teamId: string;
}): Promise<{ team: Team; membership: DynastyMembership }> {
  const { dynastyId, userId, teamId } = input;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.dynastyId !== dynastyId) {
    throw new BootstrapError("Team not found in this dynasty.", 404);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.dynastyMembership.upsert({
        where: { userId_dynastyId: { userId, dynastyId } },
        update: {},
        create: { userId, dynastyId },
      });

      // No-op if already controlling this team.
      if (membership.controlledTeamId !== teamId) {
        // Release the previously controlled team's denormalized flag.
        if (membership.controlledTeamId) {
          await tx.team.update({
            where: { id: membership.controlledTeamId },
            data: { isUserControlled: false },
          });
        }
        // Reassign (the @@unique([dynastyId, controlledTeamId]) is enforced here).
        await tx.dynastyMembership.update({
          where: { id: membership.id },
          data: { controlledTeamId: teamId },
        });
      }

      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: { isUserControlled: true },
      });
      const updatedMembership = await tx.dynastyMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });

      return { team: updatedTeam, membership: updatedMembership };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new BootstrapError(
        "That team is already controlled by another user in this dynasty.",
        409
      );
    }
    throw err;
  }
}

/** Create a dynasty-scoped custom team (not controlled) — e.g. an opponent. */
export async function addCustomTeam(input: {
  dynastyId: string;
  custom: CustomTeamInput;
}): Promise<Team> {
  const name = input.custom.name.trim();
  if (!name) throw new BootstrapError("Custom team name is required.");

  const dynasty = await prisma.dynasty.findUnique({
    where: { id: input.dynastyId },
  });
  if (!dynasty) throw new BootstrapError("Dynasty not found.", 404);

  try {
    return await prisma.team.create({
      data: {
        dynastyId: input.dynastyId,
        name,
        nickname: input.custom.nickname ?? null,
        abbreviation: input.custom.abbreviation ?? null,
        primaryColor: input.custom.primaryColor ?? null,
        secondaryColor: input.custom.secondaryColor ?? null,
        isCustom: true,
        catalogTeamId: null,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new BootstrapError(
        `A team named "${name}" already exists in this dynasty.`,
        409
      );
    }
    throw err;
  }
}

/** Create a custom team AND set it as the user's controlled team in one step. */
export async function setControlledTeamCustom(input: {
  dynastyId: string;
  userId: string;
  custom: CustomTeamInput;
}): Promise<{ team: Team; membership: DynastyMembership }> {
  const team = await addCustomTeam({
    dynastyId: input.dynastyId,
    custom: input.custom,
  });
  return setControlledTeam({
    dynastyId: input.dynastyId,
    userId: input.userId,
    teamId: team.id,
  });
}
