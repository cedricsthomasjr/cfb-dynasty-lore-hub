import { UploadDomain } from "@prisma/client";
import { registerDomain, allDomains } from "./registry";
import { teamLogoDomain } from "./team-logo";
import { teamIdentityDomain } from "./team-identity";
import { teamSeasonStatsDomain } from "./team-season-stats";
import { teamGameStatsDomain } from "./team-game-stats";
import { playerRosterDomain } from "./player-roster";
import { playerProfileDomain } from "./player-profile";
import { playerGameStatsDomain } from "./player-game-stats";
import { playerSeasonStatsDomain } from "./player-season-stats";
import { coachProfileDomain } from "./coach-profile";
import { gameBoxScoreDomain } from "./game-box-score";
import { rankingsDomain } from "./rankings";
import { conferenceStandingsDomain } from "./conference-standings";
import { awardsDomain } from "./awards";

/**
 * Register every domain handler. Importing this module wires the registry — the
 * pipeline and upload API import it for the side effect, exactly like
 * parsers/index.ts. Adding a domain = add one handler file + one line here.
 */
let registered = false;

export function registerAllDomains(): void {
  if (registered) return;
  registerDomain(teamLogoDomain);
  registerDomain(teamIdentityDomain);
  registerDomain(teamSeasonStatsDomain);
  registerDomain(teamGameStatsDomain);
  registerDomain(playerRosterDomain);
  registerDomain(playerProfileDomain);
  registerDomain(playerGameStatsDomain);
  registerDomain(playerSeasonStatsDomain);
  registerDomain(coachProfileDomain);
  registerDomain(gameBoxScoreDomain);
  registerDomain(rankingsDomain);
  registerDomain(conferenceStandingsDomain);
  registerDomain(awardsDomain);
  registered = true;

  // Contract guard: every UploadDomain value must have a handler. Fails loudly
  // in dev if an enum value is added without registering a handler for it.
  const covered = new Set(allDomains().map((d) => d.domain));
  const missing = Object.values(UploadDomain).filter((d) => !covered.has(d));
  if (missing.length > 0) {
    throw new Error(
      `Unregistered UploadDomain handler(s): ${missing.join(", ")}`
    );
  }
}

registerAllDomains();

export { registerDomain, getDomain, allDomains, domainMeta } from "./registry";
export type { DomainHandler, DomainMeta } from "./types";
