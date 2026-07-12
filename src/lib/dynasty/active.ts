import type { Dynasty, Team, Week } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface ActiveDynasty {
  dynasty: Dynasty;
  controlledTeam: Team | null;
  currentWeek: Week | null;
}

/** Cookie holding the dynasty the user "dove into" from the home menu. */
export const ACTIVE_DYNASTY_COOKIE = "activeDynastyId";

/**
 * The dynasty the app's read pages render for the current user. Prefers the
 * explicitly selected dynasty (cookie set when diving in from the home menu),
 * but only if the user is actually a member of it; otherwise falls back to their
 * most recent membership. Returns null when the user is logged out or has no
 * memberships — pages then show an empty state (they never invent data).
 */
export async function getActiveDynasty(): Promise<ActiveDynasty | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const include = {
    dynasty: { include: { currentWeek: true } },
    controlledTeam: true,
  } as const;

  const selectedId = cookies().get(ACTIVE_DYNASTY_COOKIE)?.value;
  if (selectedId) {
    const membership = await prisma.dynastyMembership.findUnique({
      where: {
        userId_dynastyId: { userId: user.id, dynastyId: selectedId },
      },
      include,
    });
    if (membership) return toActive(membership);
  }

  const membership = await prisma.dynastyMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include,
  });
  if (membership) return toActive(membership);

  return null;
}

function toActive(membership: {
  dynasty: Dynasty & { currentWeek: Week | null };
  controlledTeam: Team | null;
}): ActiveDynasty {
  const { currentWeek, ...dynasty } = membership.dynasty;
  return { dynasty, controlledTeam: membership.controlledTeam, currentWeek };
}

/** Set the active-dynasty cookie. Server Actions / Route Handlers only. */
export function setActiveDynastyCookie(dynastyId: string): void {
  cookies().set(ACTIVE_DYNASTY_COOKIE, dynastyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clear the active-dynasty cookie. Server Actions / Route Handlers only. */
export function clearActiveDynastyCookie(): void {
  cookies().delete(ACTIVE_DYNASTY_COOKIE);
}
