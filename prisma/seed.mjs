// Database seed. Runs with plain Node (no TS toolchain) via `prisma db seed`.
//
// Seeds two things:
//   1. TeamCatalog — the global FBS master list (prisma/seeds/team-catalog.json).
//      Idempotent: upserts by slug, so re-running updates rather than duplicates.
//   2. A stub dev User — matches src/lib/auth's getCurrentUser() fallback so the
//      APIs have an identity to attribute uploads/memberships to before real auth.
//
// Dynasties are NOT seeded here — they are created via POST /api/dynasties,
// which copies every catalog row into a dynasty-scoped Team (see
// src/lib/dynasty/bootstrap.ts).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Match the app's dev-user identity (src/lib/auth). */
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

/** URL-safe slug from a school name: "Miami (OH)" -> "miami-oh". */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedTeamCatalog() {
  const file = path.join(__dirname, "seeds", "team-catalog.json");
  const teams = JSON.parse(readFileSync(file, "utf8"));

  for (const t of teams) {
    const slug = slugify(t.name);
    const data = {
      slug,
      name: t.name,
      nickname: t.nickname ?? null,
      abbreviation: t.abbreviation ?? null,
      conferenceName: t.conferenceName ?? null,
      primaryColor: t.primaryColor ?? null,
      secondaryColor: t.secondaryColor ?? null,
      defaultLogoUrl: t.defaultLogoUrl ?? null,
    };
    await prisma.teamCatalog.upsert({
      where: { slug },
      update: data,
      create: data,
    });
  }
  return teams.length;
}

async function seedDevUser() {
  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: { email: DEV_USER_EMAIL, name: "Dev User" },
  });
  return user;
}

async function main() {
  const count = await seedTeamCatalog();
  const user = await seedDevUser();
  console.log(`✓ Seeded ${count} FBS teams into TeamCatalog.`);
  console.log(`✓ Dev user ready: ${user.email} (${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
