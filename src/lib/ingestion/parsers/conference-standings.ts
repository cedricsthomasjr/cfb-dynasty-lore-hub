import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { Parser, ParseContext, ParsedScreen } from "../types";
import { runVisionTool, EXTRACTION_SYSTEM } from "./base";

const Schema = z.object({
  conference: z.string().optional(),
  seasonYear: z.number().int().optional(),
  week: z.number().int().optional(),
  confidence: z.number().min(0).max(1),
  teams: z.array(
    z.object({
      team: z.string(),
      confWins: z.number().int(),
      confLosses: z.number().int(),
      overallWins: z.number().int(),
      overallLosses: z.number().int(),
    })
  ),
});

export const conferenceStandingsParser: Parser = {
  screenType: ScreenType.CONFERENCE_STANDINGS,
  version: "1.0.0",
  async parse(ctx: ParseContext): Promise<ParsedScreen> {
    const data = await runVisionTool(ctx, {
      toolName: "extract_conference_standings",
      description: "Extract the conference standings table from the screenshot.",
      system: EXTRACTION_SYSTEM,
      instruction:
        "Read the conference standings. For each team return conference and " +
        "overall wins/losses. Include the conference name, season year, and " +
        "week if visible.",
      schema: Schema,
    });

    const meta = {
      conference: data.conference,
      seasonYear: data.seasonYear,
      week: data.week,
    };

    return {
      confidence: data.confidence,
      data,
      entities: [
        { entityType: "ConferenceStandingSnapshot", payload: meta, confidence: data.confidence },
        ...data.teams.map((t) => ({
          entityType: "StandingEntry",
          payload: { ...t, ...meta },
          confidence: data.confidence,
        })),
      ],
    };
  },
};
