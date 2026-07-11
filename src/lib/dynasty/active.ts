import type { Dynasty, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface ActiveDynasty {
  dynasty: Dynasty;
  controlledTeam: Team | null;
}

/**
 * The dynasty the read pages render. There is no dynasty switcher UI yet, so
 * this resolves the current (stub) user's most recent membership, falling back
 * to the most recently created dynasty. Returns null when no dynasty exists.
 *
 * When a real multi-dynasty UI lands, this is the single seam to swap for an
 * explicit selection (route param / cookie / session).
 */
export async function getActiveDynasty(): Promise<ActiveDynasty | null> {
  const user = await getCurrentUser();
  const membership = await prisma.dynastyMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { dynasty: true, controlledTeam: true },
  });
  if (membership) {
    return { dynasty: membership.dynasty, controlledTeam: membership.controlledTeam };
  }

  const dynasty = await prisma.dynasty.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return dynasty ? { dynasty, controlledTeam: null } : null;
}
