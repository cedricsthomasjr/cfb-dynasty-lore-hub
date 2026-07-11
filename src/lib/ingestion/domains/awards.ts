import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** AWARDS — award winners / finalists / Heisman watch. Not team-scoped. */
export const awardsDomain: DomainHandler = {
  domain: UploadDomain.AWARDS,
  label: "Awards",
  description: "Award winners, finalists, or Heisman watch listings.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.AWARDS,
  allowedScreenTypes: [ScreenType.AWARDS, ScreenType.HEISMAN_WATCH],
  requiresControlledTeam: false,
  entityTypes: ["Award", "AwardWinner"],
};
