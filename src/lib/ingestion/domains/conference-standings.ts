import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/** CONFERENCE_STANDINGS — a conference standings table. Not team-scoped. */
export const conferenceStandingsDomain: DomainHandler = {
  domain: UploadDomain.CONFERENCE_STANDINGS,
  label: "Conference Standings",
  description: "A conference standings table.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  screenshotScreenType: ScreenType.CONFERENCE_STANDINGS,
  allowedScreenTypes: [ScreenType.CONFERENCE_STANDINGS],
  requiresControlledTeam: false,
  entityTypes: ["ConferenceStandingSnapshot", "StandingEntry"],
};
