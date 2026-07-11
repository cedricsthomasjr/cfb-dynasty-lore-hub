import type { Prisma } from "@prisma/client";

/**
 * Canonical promotion (Phase 3). Turns human-validated `ExtractedEntity` rows
 * into canonical entities. This is the ONLY layer allowed to write canonical
 * tables — ingestion (Phase 2/2.5) never does. A promoter is registered per
 * entity type, mirroring the parser and domain registries: adding support for a
 * new entity type = one promoter file + one register() line, no switch sprawl.
 */

/** Per-upload promotion run: shared transaction, provenance, and running refs. */
export interface PromotionContext {
  /** All canonical writes for one upload happen in a single transaction. */
  tx: Prisma.TransactionClient;
  dynastyId: string;
  /** Provenance: stamped onto canonical rows that carry sourceUploadId. */
  uploadId: string;
  /** The upload's team (controlled team for team-scoped domains), if any. */
  teamId: string | null;
  /**
   * Running reference to the game promoted earlier in this same upload, so
   * child stat lines (which don't carry game coordinates) can attach to it.
   */
  lastGameId?: string;
  /** year -> Season id cache to avoid repeat lookups within a run. */
  seasonCache: Map<number, string>;
}

export interface PromotionOutcome {
  /** Canonical model name, e.g. "RankingEntry". */
  canonicalType: string;
  /** Canonical row id the entity was merged into. */
  canonicalId: string;
}

export interface Promoter {
  /** The ExtractedEntity.entityType this promoter handles. */
  readonly entityType: string;
  /** Promote one validated entity payload into a canonical row. */
  promote(
    ctx: PromotionContext,
    payload: Record<string, unknown>
  ): Promise<PromotionOutcome>;
}

/**
 * Thrown when an entity cannot be promoted for an expected reason (missing
 * season year, unresolvable game, etc.). The orchestrator records these as
 * skips rather than failing the whole upload.
 */
export class PromotionSkip extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromotionSkip";
  }
}
