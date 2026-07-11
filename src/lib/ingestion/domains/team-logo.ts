import { InputMethod, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";
import {
  teamLogoManualSchema,
  type TeamLogoManual,
} from "../manual/schemas/team-logo";

/** TEAM_LOGO — the controlled team's logo, supplied by URL (manual only). */
export const teamLogoDomain: DomainHandler = {
  domain: UploadDomain.TEAM_LOGO,
  label: "Team Logo",
  description: "The controlled team's logo, provided as an image URL.",
  allowedInputMethods: [InputMethod.MANUAL],
  manualSchema: teamLogoManualSchema,
  requiresControlledTeam: true,
  entityTypes: ["TeamLogo"],
  buildManualEntities(payload) {
    const data = payload as TeamLogoManual;
    return [{ entityType: "TeamLogo", payload: data, confidence: 1 }];
  },
};
