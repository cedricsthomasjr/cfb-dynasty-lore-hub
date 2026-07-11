import { InputMethod, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";
import {
  teamIdentityManualSchema,
  type TeamIdentityManual,
} from "../manual/schemas/team-identity";

/** TEAM_IDENTITY — name / mascot / colors for the controlled team (manual). */
export const teamIdentityDomain: DomainHandler = {
  domain: UploadDomain.TEAM_IDENTITY,
  label: "Team Identity",
  description: "Name, mascot, abbreviation, and colors for the controlled team.",
  allowedInputMethods: [InputMethod.MANUAL],
  manualSchema: teamIdentityManualSchema,
  requiresControlledTeam: true,
  entityTypes: ["TeamIdentity"],
  buildManualEntities(payload) {
    const data = payload as TeamIdentityManual;
    return [{ entityType: "TeamIdentity", payload: data, confidence: 1 }];
  },
};
