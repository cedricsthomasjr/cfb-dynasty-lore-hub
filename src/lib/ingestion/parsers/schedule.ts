import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { Parser, ParseContext, ParsedScreen } from "../types";
import { runVisionTool, EXTRACTION_SYSTEM } from "./base";

/**
 * TEAM_SCHEDULE — a team's season schedule screen. Each row is a week with an
 * opponent and a home/away marker: "@ Opponent" is an away game, "vs Opponent"
 * is a home game. We read only matchups (never scores) — results still come from
 * a box score. Like every parser, this NEVER writes canonical rows; it returns
 * structured matchups the onboarding schedule builder pre-fills for the user to
 * confirm before saving.
 */
const Schema = z.object({
  team: z.string().optional(), // whose schedule this is (the controlled team)
  seasonYear: z.number().int().optional(),
  games: z.array(
    z.object({
      week: z.number().int(),
      opponent: z.string(),
      // From the schedule owner's perspective: "vs" = HOME, "@" = AWAY.
      homeAway: z.enum(["HOME", "AWAY", "NEUTRAL"]),
    })
  ),
  confidence: z.number().min(0).max(1),
});

export const scheduleParser: Parser = {
  screenType: ScreenType.TEAM_SCHEDULE,
  version: "1.0.0",
  async parse(ctx: ParseContext): Promise<ParsedScreen> {
    const data = await runVisionTool(ctx, {
      toolName: "extract_team_schedule",
      description: "Extract a team's season schedule: week, opponent, home/away.",
      system: EXTRACTION_SYSTEM,
      instruction:
        "Read this team's season schedule. For each week return the week " +
        "number, the opponent's name, and whether it is home or away. A line " +
        'like "@ Auburn" means AWAY; "vs Auburn" (or "Auburn" with no @) means ' +
        "HOME; a neutral-site game is NEUTRAL. Do not read or invent scores. " +
        "Include the season year and whose schedule this is if visible.",
      schema: Schema,
    });

    return {
      confidence: data.confidence,
      data,
      entities: data.games.map((g) => ({
        entityType: "ScheduledGame",
        payload: {
          team: data.team,
          opponent: g.opponent,
          week: g.week,
          isHome: g.homeAway !== "AWAY",
          seasonYear: data.seasonYear,
        },
        confidence: data.confidence,
      })),
    };
  },
};
