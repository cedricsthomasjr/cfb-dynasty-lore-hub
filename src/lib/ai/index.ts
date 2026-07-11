import type { VisionProvider } from "./types";
import { AnthropicVisionProvider } from "./anthropic-driver";
import { MockVisionProvider } from "./mock-driver";

export type { VisionProvider, VisionToolRequest, VisionToolResponse } from "./types";

let cached: VisionProvider | null = null;

/**
 * Resolve the active vision provider.
 * - VISION_DRIVER="mock"       -> deterministic fixtures (no network)
 * - VISION_DRIVER="anthropic"  -> real Claude vision
 * - unset                      -> anthropic if ANTHROPIC_API_KEY is present, else mock
 */
export function getVision(): VisionProvider {
  if (cached) return cached;

  const driver =
    process.env.VISION_DRIVER ??
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock");

  cached = driver === "anthropic" ? new AnthropicVisionProvider() : new MockVisionProvider();
  return cached;
}
