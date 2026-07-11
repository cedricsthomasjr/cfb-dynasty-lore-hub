import type { ScreenType } from "@prisma/client";
import type { VisionProvider } from "@/lib/ai";

/**
 * Ingestion contracts. A parser turns one screenshot into validated structured
 * data plus a set of candidate entities. Parsers NEVER write to canonical
 * tables — they only produce staging candidates the pipeline persists and a
 * human later validates.
 */

export interface ParseContext {
  imageBase64: string;
  mediaType: string;
  vision: VisionProvider;
}

/** A single candidate row awaiting validation (one ExtractedEntity). */
export interface ExtractedCandidate {
  entityType: string;
  payload: Record<string, unknown>;
  confidence: number; // 0..1
}

export interface ParsedScreen {
  /** Overall confidence for the parse (0..1). */
  confidence: number;
  /** Full validated structured data as the parser read it. */
  data: Record<string, unknown>;
  /** Candidate entities to stage for review. */
  entities: ExtractedCandidate[];
}

export interface Parser {
  readonly screenType: ScreenType;
  readonly version: string;
  parse(ctx: ParseContext): Promise<ParsedScreen>;
}

export interface DetectionResult {
  screenType: ScreenType;
  confidence: number; // 0..1
  reasoning?: string;
}
