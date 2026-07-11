import { registerPromoter } from "../registry";
import { rankingSnapshotPromoter, rankingEntryPromoter } from "./ranking";
import { standingSnapshotPromoter, standingEntryPromoter } from "./standings";
import { gamePromoter } from "./game";
import { playerGameStatPromoter } from "./player-game-stat";
import { playerPromoter } from "./player";
import { teamLogoPromoter, teamIdentityPromoter } from "./team";

/**
 * Register all canonical promoters. Importing this module wires the promotion
 * registry, exactly like parsers/index.ts and domains/index.ts. Adding an entity
 * type = add one promoter file + one line here.
 *
 * Not every staged entity type has a promoter yet — e.g. TeamSeasonStat and
 * TeamGameStat aren't produced by any parser/domain today. Those are left
 * validated-but-unpromoted (recorded as skips) until their producers + promoters
 * land; no core change is required to add them.
 */
let registered = false;

export function registerAllPromoters(): void {
  if (registered) return;
  registerPromoter(rankingSnapshotPromoter);
  registerPromoter(rankingEntryPromoter);
  registerPromoter(standingSnapshotPromoter);
  registerPromoter(standingEntryPromoter);
  registerPromoter(gamePromoter);
  registerPromoter(playerGameStatPromoter);
  registerPromoter(playerPromoter);
  registerPromoter(teamLogoPromoter);
  registerPromoter(teamIdentityPromoter);
  registered = true;
}

registerAllPromoters();
