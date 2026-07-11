import { z } from "zod";

/**
 * Manual payload for the PLAYER_GAME_STATS domain — a stat line per player for a
 * single game. Columns mirror PlayerGameStat (all optional; a player only fills
 * the categories that apply). Staged as one PlayerGameStat candidate per row.
 */
const statLineSchema = z.object({
  name: z.string().min(1), // player as displayed
  // passing
  passComp: z.number().int().min(0).optional(),
  passAtt: z.number().int().min(0).optional(),
  passYards: z.number().int().optional(),
  passTd: z.number().int().min(0).optional(),
  passInt: z.number().int().min(0).optional(),
  // rushing
  rushAtt: z.number().int().min(0).optional(),
  rushYards: z.number().int().optional(),
  rushTd: z.number().int().min(0).optional(),
  // receiving
  rec: z.number().int().min(0).optional(),
  recYards: z.number().int().optional(),
  recTd: z.number().int().min(0).optional(),
  // defense
  tackles: z.number().int().min(0).optional(),
  sacks: z.number().min(0).optional(),
  defInt: z.number().int().min(0).optional(),
  forcedFumbles: z.number().int().min(0).optional(),
  // kicking
  fgMade: z.number().int().min(0).optional(),
  fgAtt: z.number().int().min(0).optional(),
});

export const playerGameStatsManualSchema = z.object({
  gameLabel: z.string().optional(), // e.g. "Week 5 vs Ohio State"
  opponent: z.string().optional(),
  players: z.array(statLineSchema).min(1),
});

export type PlayerGameStatsManual = z.infer<typeof playerGameStatsManualSchema>;
