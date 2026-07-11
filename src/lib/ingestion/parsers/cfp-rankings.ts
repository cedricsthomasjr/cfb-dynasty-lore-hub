import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { Parser, ParseContext, ParsedScreen } from "../types";
import { runVisionTool, EXTRACTION_SYSTEM } from "./base";

const Schema = z.object({
  seasonYear: z.number().int().optional(),
  week: z.number().int().optional(),
  confidence: z.number().min(0).max(1),
  entries: z.array(
    z.object({
      rank: z.number().int(),
      team: z.string(),
      record: z.string().optional(),
    })
  ),
});

export const cfpRankingsParser: Parser = {
  screenType: ScreenType.CFP_RANKINGS,
  version: "1.0.0",
  async parse(ctx: ParseContext): Promise<ParsedScreen> {
    const data = await runVisionTool(ctx, {
      toolName: "extract_cfp_rankings",
      description: "Extract the College Football Playoff committee ranking table.",
      system: EXTRACTION_SYSTEM,
      instruction:
        "Read the CFP rankings. For each team return its rank, name, and " +
        "record. Include season year and week if visible.",
      schema: Schema,
    });

    const meta = { pollType: "CFP", seasonYear: data.seasonYear, week: data.week };

    return {
      confidence: data.confidence,
      data,
      entities: [
        { entityType: "RankingSnapshot", payload: meta, confidence: data.confidence },
        ...data.entries.map((e) => ({
          entityType: "RankingEntry",
          payload: { ...e, ...meta },
          confidence: data.confidence,
        })),
      ],
    };
  },
};
