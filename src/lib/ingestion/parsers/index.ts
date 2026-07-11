import { registerParser } from "../registry";
import { top25Parser } from "./top25";
import { cfpRankingsParser } from "./cfp-rankings";
import { conferenceStandingsParser } from "./conference-standings";
import { boxScoreParser } from "./box-score";

/**
 * Register all built-in parsers. Importing this module wires the registry.
 * Adding a screen type = add one parser file and one line here — no changes to
 * the pipeline, detector, or API. (More screen types from the Phase 2 catalog
 * plug in the same way.)
 */
let registered = false;

export function registerAllParsers(): void {
  if (registered) return;
  registerParser(top25Parser);
  registerParser(cfpRankingsParser);
  registerParser(conferenceStandingsParser);
  registerParser(boxScoreParser);
  registered = true;
}

registerAllParsers();
