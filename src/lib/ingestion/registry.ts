import type { ScreenType } from "@prisma/client";
import type { Parser } from "./types";

/**
 * Parser registry. In Phase 2 each screen type registers its parser here and
 * the detector/pipeline resolve parsers by ScreenType. Kept empty in Phase 1;
 * adding a screen type = adding one file + one register() call, no core edits.
 */
const registry = new Map<ScreenType, Parser>();

export function registerParser(parser: Parser): void {
  registry.set(parser.screenType, parser);
}

export function getParser(screenType: ScreenType): Parser | undefined {
  return registry.get(screenType);
}

export function allParsers(): Parser[] {
  return [...registry.values()];
}
