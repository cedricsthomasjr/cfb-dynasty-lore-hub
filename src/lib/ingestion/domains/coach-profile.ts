import { InputMethod, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/**
 * COACH_PROFILE — a coach on the controlled team's staff. No dedicated screen
 * type yet, so a screenshot falls back to the detector; team-scoped like the
 * other roster domains.
 */
export const coachProfileDomain: DomainHandler = {
  domain: UploadDomain.COACH_PROFILE,
  label: "Coach Profile",
  description: "A coach on the controlled team's staff.",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  requiresControlledTeam: true,
  entityTypes: ["Coach"],
};
