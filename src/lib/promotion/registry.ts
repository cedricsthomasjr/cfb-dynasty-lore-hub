import type { Promoter } from "./types";

/**
 * Promotion registry — parallel to the parser and domain registries. Maps an
 * ExtractedEntity.entityType to the promoter that writes its canonical row.
 * Adding support for an entity type = one promoter file + one registerPromoter()
 * call in promoters/index.ts.
 */
const registry = new Map<string, Promoter>();

export function registerPromoter(promoter: Promoter): void {
  registry.set(promoter.entityType, promoter);
}

export function getPromoter(entityType: string): Promoter | undefined {
  return registry.get(entityType);
}

export function allPromoters(): Promoter[] {
  return [...registry.values()];
}
