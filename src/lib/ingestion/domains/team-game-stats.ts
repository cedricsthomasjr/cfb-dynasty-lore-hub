import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** TEAM_GAME_STATS — per-game team stats, read from a box score (screenshot). */
export const teamGameStatsDomain: DomainHandler = {
  domain: UploadDomain.TEAM_GAME_STATS,
  label: "Team Game Stats",
  description: "Single-game team statistics for the controlled team.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.BOX_SCORE,
  allowedScreenTypes: [ScreenType.BOX_SCORE],
  requiresControlledTeam: true,
  entityTypes: ["TeamGameStat"],
};
