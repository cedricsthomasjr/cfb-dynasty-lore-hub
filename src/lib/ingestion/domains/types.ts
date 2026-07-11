import type { z } from "zod";
import type { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { ExtractedCandidate } from "../types";

/**
 * A DomainHandler describes one UploadDomain: what it carries, how it can be
 * ingested (screenshot vs. manual), how a screenshot maps onto the existing
 * parser registry, and — for manual input — the Zod schema its payload must
 * satisfy. This registry is the contract future upload pages build against;
 * adding a domain is one handler file + one line in domains/index.ts.
 */
export interface DomainHandler {
  readonly domain: UploadDomain;
  readonly label: string;
  readonly description: string;

  /** Which ingestion paths this domain supports. */
  readonly allowedInputMethods: InputMethod[];

  /**
   * Screen types a screenshot for this domain may classify as. Used to validate
   * a detector result when no single `screenshotScreenType` pins it.
   */
  readonly allowedScreenTypes?: ScreenType[];

  /**
   * If set, a screenshot for this domain routes straight to this screen type's
   * parser — the pipeline skips auto-detection (faster, more reliable). If
   * unset, the pipeline falls back to the detector.
   */
  readonly screenshotScreenType?: ScreenType;

  /** Zod schema a MANUAL payload is validated against (required for manual). */
  readonly manualSchema?: z.ZodType;

  /** Team-scoped domains must target the uploader's controlled team. */
  readonly requiresControlledTeam: boolean;

  /** Staging entity types this domain produces (documentation + review hints). */
  readonly entityTypes: string[];

  /**
   * Manual path only: turn a validated payload into staging candidates. If a
   * manual domain omits this, the pipeline stages a single entity of
   * entityTypes[0] carrying the whole payload.
   */
  buildManualEntities?(payload: unknown): ExtractedCandidate[];
}

/** Serializable view of a handler — safe to send to clients / future upload UIs. */
export interface DomainMeta {
  domain: UploadDomain;
  label: string;
  description: string;
  allowedInputMethods: InputMethod[];
  allowedScreenTypes?: ScreenType[];
  screenshotScreenType?: ScreenType;
  supportsManual: boolean;
  requiresControlledTeam: boolean;
  entityTypes: string[];
}
