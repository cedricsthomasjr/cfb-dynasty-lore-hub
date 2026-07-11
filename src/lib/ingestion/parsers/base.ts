import { z } from "zod";
import type { ParseContext } from "../types";

/**
 * Bridges a Zod schema to a vision tool call: derives the tool's JSON Schema
 * from the Zod schema, forces the model to return matching structured data,
 * then validates the response against the same schema. If the model returns
 * something off-shape, validation throws here rather than corrupting staging.
 */
export async function runVisionTool<T extends z.ZodTypeAny>(
  ctx: ParseContext,
  opts: {
    toolName: string;
    description: string;
    system: string;
    instruction: string;
    schema: T;
  }
): Promise<z.infer<T>> {
  const inputSchema = z.toJSONSchema(opts.schema, {
    target: "draft-7",
  }) as Record<string, unknown>;

  const res = await ctx.vision.extract({
    imageBase64: ctx.imageBase64,
    mediaType: ctx.mediaType,
    system: opts.system,
    instruction: opts.instruction,
    tool: {
      name: opts.toolName,
      description: opts.description,
      inputSchema,
    },
  });

  return opts.schema.parse(res.data);
}

/** Shared system prompt: the extract-don't-invent contract. */
export const EXTRACTION_SYSTEM =
  "You extract structured data from College Football 25 (Xbox) screenshots. " +
  "Transcribe only what is visibly present in the image. Never guess, infer, " +
  "or invent teams, players, numbers, scores, or ranks. If a value is not " +
  "legible, omit it. Report an honest confidence score reflecting how clearly " +
  "you could read the screen.";
