import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "./session";

export { setSession, clearSession, getSessionUserId } from "./session";
export { hashPassword, verifyPassword } from "./password";

/** Thrown when an action/route requires a signed-in user but none is present. */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Not authenticated.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * The single identity seam. Resolves the acting user from the session cookie,
 * returning null when nobody is signed in. Swapping in a different auth provider
 * means changing how the session id is resolved here — callers don't change.
 *
 * DEV_USER_ID / DEV_USER_EMAIL remain honored as an explicit override for
 * scripts and offline flows, but there is no implicit stub user anymore: with no
 * session and no override, the caller is treated as logged out.
 */
export async function getCurrentUser(): Promise<User | null> {
  const sessionUserId = getSessionUserId();
  if (sessionUserId) {
    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (user) return user;
  }

  const devId = process.env.DEV_USER_ID;
  if (devId) return prisma.user.findUnique({ where: { id: devId } });

  const devEmail = process.env.DEV_USER_EMAIL;
  if (devEmail) {
    return prisma.user.upsert({
      where: { email: devEmail },
      update: {},
      create: { email: devEmail, name: "Dev User" },
    });
  }

  return null;
}

/** Like getCurrentUser but throws UnauthorizedError instead of returning null. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
