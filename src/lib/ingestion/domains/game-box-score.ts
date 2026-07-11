import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/**
 * GAME_BOX_SCORE — a full game box score. Team-agnostic: teamId is optional at
 * upload and the participating teams are resolved during canonical promotion
 * (Phase 3). Routes to the existing BOX_SCORE parser.
 */
export const gameBoxScoreDomain: DomainHandler = {
  domain: UploadDomain.GAME_BOX_SCORE,
  label: "Game Box Score",
  description: "A full game box score (both teams).",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.BOX_SCORE,
  allowedScreenTypes: [ScreenType.BOX_SCORE, ScreenType.GAME_RESULTS],
  requiresControlledTeam: false,
  entityTypes: ["Game", "TeamGameStat", "PlayerGameStat"],
};
