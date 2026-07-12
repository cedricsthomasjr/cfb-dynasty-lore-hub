import type { VisionProvider, VisionToolRequest, VisionToolResponse } from "./types";

/**
 * Deterministic vision provider for local dev, tests, and CI. Returns canned
 * structured data keyed by the requested tool name so the full ingestion
 * pipeline (detect -> parse -> stage) can run end-to-end without an API key or
 * network access. Never used in production (see getVision()).
 */
export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  async extract(req: VisionToolRequest): Promise<VisionToolResponse> {
    const data = FIXTURES[req.tool.name];
    if (!data) {
      throw new Error(
        `MockVisionProvider has no fixture for tool "${req.tool.name}".`
      );
    }
    return { toolName: req.tool.name, data, model: "mock" };
  }
}

// Fixtures intentionally mirror each parser/detector schema shape.
const FIXTURES: Record<string, unknown> = {
  classify_screen: {
    screenType: "TOP_25",
    confidence: 0.94,
    reasoning: "Mock classification.",
  },
  extract_top25: {
    pollName: "AP Top 25",
    seasonYear: 2027,
    week: 8,
    confidence: 0.9,
    entries: [
      { rank: 1, team: "Georgia", record: "8-0", previousRank: 1, points: 1550 },
      { rank: 2, team: "Michigan", record: "8-0", previousRank: 3, points: 1490 },
      { rank: 3, team: "Texas", record: "7-1", previousRank: 2, points: 1401 },
      { rank: 4, team: "Ohio State", record: "7-1", previousRank: 5, points: 1360 },
    ],
  },
  extract_cfp_rankings: {
    seasonYear: 2027,
    week: 12,
    confidence: 0.88,
    entries: [
      { rank: 1, team: "Georgia", record: "11-0" },
      { rank: 2, team: "Michigan", record: "11-0" },
      { rank: 3, team: "Texas", record: "10-1" },
      { rank: 4, team: "Oregon", record: "10-1" },
    ],
  },
  extract_conference_standings: {
    conference: "SEC",
    seasonYear: 2027,
    week: 8,
    confidence: 0.86,
    teams: [
      { team: "Georgia", confWins: 5, confLosses: 0, overallWins: 8, overallLosses: 0 },
      { team: "Texas", confWins: 4, confLosses: 1, overallWins: 7, overallLosses: 1 },
      { team: "Alabama", confWins: 3, confLosses: 2, overallWins: 6, overallLosses: 2 },
    ],
  },
  extract_team_schedule: {
    team: "Alabama",
    seasonYear: 2027,
    confidence: 0.87,
    games: [
      { week: 1, opponent: "Georgia", homeAway: "HOME" },
      { week: 2, opponent: "Auburn", homeAway: "AWAY" },
      { week: 3, opponent: "Tennessee", homeAway: "HOME" },
      { week: 4, opponent: "LSU", homeAway: "AWAY" },
      { week: 5, opponent: "Texas", homeAway: "HOME" },
    ],
  },
  extract_box_score: {
    seasonYear: 2027,
    week: 8,
    homeTeam: "Georgia",
    awayTeam: "Florida",
    homeScore: 34,
    awayScore: 17,
    status: "FINAL",
    confidence: 0.83,
    playerStats: [
      {
        player: "Carson Beck",
        team: "Georgia",
        passYards: 312,
        passTd: 3,
        passInt: 0,
      },
      {
        player: "Trevor Etienne",
        team: "Georgia",
        rushYards: 118,
        rushTd: 1,
      },
    ],
  },
};
