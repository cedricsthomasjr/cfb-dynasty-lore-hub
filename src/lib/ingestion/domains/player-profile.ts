import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** PLAYER_PROFILE — a single player's bio/attributes card (screenshot). */
export const playerProfileDomain: DomainHandler = {
  domain: UploadDomain.PLAYER_PROFILE,
  label: "Player Profile",
  description: "A single player's profile card for the controlled team.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.PLAYER_CARD,
  allowedScreenTypes: [ScreenType.PLAYER_CARD],
  requiresControlledTeam: true,
  entityTypes: ["Player"],
};
