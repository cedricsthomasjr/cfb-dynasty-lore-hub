import Anthropic from "@anthropic-ai/sdk";
import type { VisionProvider, VisionToolRequest, VisionToolResponse } from "./types";

/**
 * Real vision provider backed by Claude. Forces a single tool call so the model
 * returns structured JSON matching the parser's schema — the model narrates the
 * pixels it can see, it never invents data.
 */
export class AnthropicVisionProvider implements VisionProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    // Reads ANTHROPIC_API_KEY from the environment.
    this.client = new Anthropic();
    this.model = process.env.VISION_MODEL ?? "claude-opus-4-8";
  }

  async extract(req: VisionToolRequest): Promise<VisionToolResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: req.system,
      tools: [
        {
          name: req.tool.name,
          description: req.tool.description,
          input_schema: req.tool.inputSchema as Anthropic.Tool.InputSchema,
        },
      ],
      // Force the model to answer through the structured tool.
      tool_choice: { type: "tool", name: req.tool.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: req.mediaType as
                  | "image/png"
                  | "image/jpeg"
                  | "image/webp"
                  | "image/gif",
                data: req.imageBase64,
              },
            },
            { type: "text", text: req.instruction },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(
        `Vision model did not return a tool_use block (stop_reason=${message.stop_reason}).`
      );
    }

    return {
      toolName: toolUse.name,
      data: toolUse.input,
      model: message.model,
    };
  }
}
