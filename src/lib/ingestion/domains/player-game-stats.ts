import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";
import {
  playerGameStatsManualSchema,
  type PlayerGameStatsManual,
} from "../manual/schemas/player-game-stats";

/** PLAYER_GAME_STATS — per-player stat lines for one game (screenshot/manual). */
export const playerGameStatsDomain: DomainHandler = {
  domain: UploadDomain.PLAYER_GAME_STATS,
  label: "Player Game Stats",
  description: "Per-player statistics for a single game.",
  allowedInputMethods: [InputMethod.SCREENSHOT, InputMethod.MANUAL],
  screenshotScreenType: ScreenType.PLAYER_STATS,
  allowedScreenTypes: [ScreenType.PLAYER_STATS, ScreenType.BOX_SCORE],
  manualSchema: playerGameStatsManualSchema,
  requiresControlledTeam: true,
  entityTypes: ["PlayerGameStat"],
  buildManualEntities(payload) {
    const data = payload as PlayerGameStatsManual;
    const meta = { gameLabel: data.gameLabel, opponent: data.opponent };
    return data.players.map((p) => ({
      entityType: "PlayerGameStat",
      payload: { ...p, ...meta },
      confidence: 1,
    }));
  },
};
