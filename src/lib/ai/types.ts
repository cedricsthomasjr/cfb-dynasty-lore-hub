/**
 * Vision provider abstraction. The pipeline needs exactly one primitive from
 * the model: "given an image and a tool schema, return structured JSON that
 * matches the schema." Both the screen-type detector and every parser are
 * built on top of this single call, so the provider (real Claude vision vs. a
 * deterministic mock) can be swapped via env without touching pipeline code.
 */

export interface VisionToolRequest {
  /** Base64-encoded image bytes (no data: prefix). */
  imageBase64: string;
  /** MIME type of the image, e.g. "image/png". */
  mediaType: string;
  /** System prompt establishing the extract-don't-invent contract. */
  system: string;
  /** The task instruction shown alongside the image. */
  instruction: string;
  /** The single tool the model is forced to call to return structured data. */
  tool: {
    name: string;
    description: string;
    /** JSON Schema (object) describing the tool input. */
    inputSchema: Record<string, unknown>;
  };
}

export interface VisionToolResponse {
  /** Name of the tool the model called. */
  toolName: string;
  /** The structured payload the model returned (still unvalidated). */
  data: unknown;
  /** Model id that produced the response ("mock" for the mock driver). */
  model: string;
}

export interface VisionProvider {
  readonly name: string;
  extract(req: VisionToolRequest): Promise<VisionToolResponse>;
}
