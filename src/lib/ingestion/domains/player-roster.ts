import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";
import {
  playerRosterManualSchema,
  type PlayerRosterManual,
} from "../manual/schemas/player-roster";

/** PLAYER_ROSTER — the controlled team's roster (screenshot or manual list). */
export const playerRosterDomain: DomainHandler = {
  domain: UploadDomain.PLAYER_ROSTER,
  label: "Player Roster",
  description: "The controlled team's roster of players.",
  allowedInputMethods: [InputMethod.SCREENSHOT, InputMethod.MANUAL],
  screenshotScreenType: ScreenType.TEAM_ROSTER,
  allowedScreenTypes: [ScreenType.TEAM_ROSTER],
  manualSchema: playerRosterManualSchema,
  requiresControlledTeam: true,
  entityTypes: ["Player"],
  buildManualEntities(payload) {
    const data = payload as PlayerRosterManual;
    return data.players.map((p) => ({
      entityType: "Player",
      payload: p,
      confidence: 1,
    }));
  },
};
