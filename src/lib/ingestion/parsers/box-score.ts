import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { Parser, ParseContext, ParsedScreen } from "../types";
import { runVisionTool, EXTRACTION_SYSTEM } from "./base";

const Schema = z.object({
  seasonYear: z.number().int().optional(),
  week: z.number().int().optional(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number().int().optional(),
  awayScore: z.number().int().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "FINAL"]).optional(),
  confidence: z.number().min(0).max(1),
  playerStats: z
    .array(
      z.object({
        player: z.string(),
        team: z.string(),
        passYards: z.number().int().optional(),
        passTd: z.number().int().optional(),
        passInt: z.number().int().optional(),
        rushYards: z.number().int().optional(),
        rushTd: z.number().int().optional(),
        recYards: z.number().int().optional(),
        recTd: z.number().int().optional(),
        tackles: z.number().int().optional(),
      })
    )
    .optional(),
});

export const boxScoreParser: Parser = {
  screenType: ScreenType.BOX_SCORE,
  version: "1.0.0",
  async parse(ctx: ParseContext): Promise<ParsedScreen> {
    const data = await runVisionTool(ctx, {
      toolName: "extract_box_score",
      description: "Extract the game box score and player stat lines.",
      system: EXTRACTION_SYSTEM,
      instruction:
        "Read the box score. Return both team names, the final score, game " +
        "status, and each listed player's stat line. Include season year and " +
        "week if visible.",
      schema: Schema,
    });

    const game = {
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: data.status,
      seasonYear: data.seasonYear,
      week: data.week,
    };

    return {
      confidence: data.confidence,
      data,
      entities: [
        { entityType: "Game", payload: game, confidence: data.confidence },
        ...(data.playerStats ?? []).map((p) => ({
          entityType: "PlayerGameStat",
          payload: { ...p, homeTeam: data.homeTeam, awayTeam: data.awayTeam },
          confidence: data.confidence,
        })),
      ],
    };
  },
};
