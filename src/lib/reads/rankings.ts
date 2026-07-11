import type { PollType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** The most recent ranking snapshot of the given poll types for a dynasty. */
export async function latestRankingSnapshot(
  dynastyId: string,
  pollTypes: PollType[]
) {
  return prisma.rankingSnapshot.findFirst({
    where: { pollType: { in: pollTypes }, season: { dynastyId } },
    orderBy: { capturedAt: "desc" },
    include: {
      season: true,
      week: true,
      entries: { orderBy: { rank: "asc" }, include: { team: true } },
    },
  });
}
