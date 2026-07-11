import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Stub authentication. There is no auth provider yet; every request runs as a
 * single seeded dev user. This is the ONLY place that resolves "who is acting",
 * so wiring real auth later (Clerk / NextAuth / session) means changing this
 * function's body — no route or service signatures change.
 *
 * Resolution order:
 *   1. DEV_USER_ID  -> look up that exact user (must exist)
 *   2. DEV_USER_EMAIL (default "dev@localhost") -> upsert-by-email so a dev user
 *      always exists even without running the seed.
 */
export async function getCurrentUser(): Promise<User> {
  const byId = process.env.DEV_USER_ID;
  if (byId) {
    const user = await prisma.user.findUnique({ where: { id: byId } });
    if (!user) {
      throw new Error(
        `DEV_USER_ID=${byId} does not match any User. Seed the database or unset it.`
      );
    }
    return user;
  }

  const email = process.env.DEV_USER_EMAIL ?? "dev@localhost";
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Dev User" },
  });
}
