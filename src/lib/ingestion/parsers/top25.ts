import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { Parser, ParseContext, ParsedScreen } from "../types";
import { runVisionTool, EXTRACTION_SYSTEM } from "./base";

const Schema = z.object({
  pollName: z.string().optional(),
  seasonYear: z.number().int().optional(),
  week: z.number().int().optional(),
  confidence: z.number().min(0).max(1),
  entries: z.array(
    z.object({
      rank: z.number().int(),
      team: z.string(),
      record: z.string().optional(),
      previousRank: z.number().int().optional(),
      points: z.number().int().optional(),
    })
  ),
});

export const top25Parser: Parser = {
  screenType: ScreenType.TOP_25,
  version: "1.0.0",
  async parse(ctx: ParseContext): Promise<ParsedScreen> {
    const data = await runVisionTool(ctx, {
      toolName: "extract_top25",
      description: "Extract the full Top 25 ranking table from the screenshot.",
      system: EXTRACTION_SYSTEM,
      instruction:
        "Read the Top 25 poll. For each ranked team return its rank, name, " +
        "record, previous rank, and points if shown. Include the poll name, " +
        "season year, and week if visible.",
      schema: Schema,
    });

    const meta = {
      pollType: "AP",
      pollName: data.pollName,
      seasonYear: data.seasonYear,
      week: data.week,
    };

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
