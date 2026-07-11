import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** TEAM_SEASON_STATS — the controlled team's season totals (screenshot). */
export const teamSeasonStatsDomain: DomainHandler = {
  domain: UploadDomain.TEAM_SEASON_STATS,
  label: "Team Season Stats",
  description: "Season-long team statistics for the controlled team.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.TEAM_STATS,
  allowedScreenTypes: [ScreenType.TEAM_STATS, ScreenType.SEASON_STATISTICS],
  requiresControlledTeam: true,
  entityTypes: ["TeamSeasonStat"],
};
