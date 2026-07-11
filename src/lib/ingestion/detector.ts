import { z } from "zod";
import { ScreenType } from "@prisma/client";
import type { ParseContext, DetectionResult } from "./types";
import { runVisionTool } from "./parsers/base";

const screenTypeValues = Object.values(ScreenType);

const DetectionSchema = z.object({
  screenType: z.enum(ScreenType),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

const SYSTEM =
  "You are a screen classifier for College Football 25 (Xbox) screenshots. " +
  "Identify which in-game screen the image shows, using only what is visible. " +
  "If it does not clearly match a known screen, classify it as UNKNOWN.";

/**
 * Classify an uploaded screenshot into a ScreenType. This is the first stage of
 * the pipeline; the detected type selects which parser runs next.
 */
export async function detectScreenType(ctx: ParseContext): Promise<DetectionResult> {
  const result = await runVisionTool(ctx, {
    toolName: "classify_screen",
    description:
      "Report which CFB 25 screen this screenshot shows, with a confidence score.",
    system: SYSTEM,
    instruction: `Classify this screenshot into exactly one of: ${screenTypeValues.join(
      ", "
    )}. Return your confidence (0..1).`,
    schema: DetectionSchema,
  });

  return {
    screenType: result.screenType as ScreenType,
    confidence: result.confidence,
    reasoning: result.reasoning,
  };
}
