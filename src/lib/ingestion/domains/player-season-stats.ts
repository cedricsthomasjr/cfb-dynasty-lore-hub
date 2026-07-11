import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** PLAYER_SEASON_STATS — season stat totals for the controlled team's players. */
export const playerSeasonStatsDomain: DomainHandler = {
  domain: UploadDomain.PLAYER_SEASON_STATS,
  label: "Player Season Stats",
  description: "Season stat totals for the controlled team's players.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.SEASON_STATISTICS,
  allowedScreenTypes: [ScreenType.SEASON_STATISTICS, ScreenType.PLAYER_STATS],
  requiresControlledTeam: true,
  entityTypes: ["PlayerSeasonStat"],
};
