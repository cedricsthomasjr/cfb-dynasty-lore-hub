import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPromoter } from "./registry";
import { PromotionSkip, type PromotionContext } from "./types";
import "./promoters"; // side-effect: registers all promoters

export interface PromotionResultItem {
  entityId: string;
  entityType: string;
  status: "promoted" | "skipped" | "already";
  canonicalType?: string;
  canonicalId?: string;
  reason?: string;
}

export interface PromotionSummary {
  uploadId: string;
  promoted: number;
  skipped: number;
  already: number;
  items: PromotionResultItem[];
}

/**
 * Promote every human-validated ExtractedEntity of one upload into canonical
 * tables, in a single transaction. Idempotent: an entity already carrying
 * `mergedIntoId` is skipped, so re-validating never double-writes. Entities that
 * can't be resolved (e.g. missing season year) are recorded as skips without
 * failing the whole upload. Entity types with no registered promoter are left
 * validated-but-unpromoted (future promoters pick them up).
 */
export async function promoteUpload(uploadId: string): Promise<PromotionSummary> {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      parseResults: {
        orderBy: { createdAt: "asc" },
        include: { entities: { orderBy: { id: "asc" } } },
      },
    },
  });
  if (!upload) throw new Error(`Upload ${uploadId} not found.`);
  if (!upload.dynastyId) {
    throw new Error(`Upload ${uploadId} has no dynasty; cannot promote.`);
  }
  const dynastyId = upload.dynastyId;
  const teamId = upload.teamId;

  // Validated candidates, in stable order (snapshot/game before their children).
  const entities = upload.parseResults
    .flatMap((pr) => pr.entities)
    .filter((e) => e.isValidated);

  const items: PromotionResultItem[] = [];

  await prisma.$transaction(
    async (tx) => {
      const ctx: PromotionContext = {
        tx,
        dynastyId,
        uploadId,
        teamId,
        seasonCache: new Map(),
      };

      for (const entity of entities) {
        if (entity.mergedIntoId) {
          items.push({
            entityId: entity.id,
            entityType: entity.entityType,
            status: "already",
            canonicalId: entity.mergedIntoId,
          });
          continue;
        }

        const promoter = getPromoter(entity.entityType);
        if (!promoter) {
          items.push({
            entityId: entity.id,
            entityType: entity.entityType,
            status: "skipped",
            reason: `no promoter registered for ${entity.entityType}`,
          });
          continue;
        }

        try {
          const payload = (entity.payload ?? {}) as Record<string, unknown>;
          const outcome = await promoter.promote(ctx, payload);
          await tx.extractedEntity.update({
            where: { id: entity.id },
            data: { mergedIntoId: outcome.canonicalId },
          });
          items.push({
            entityId: entity.id,
            entityType: entity.entityType,
            status: "promoted",
            canonicalType: outcome.canonicalType,
            canonicalId: outcome.canonicalId,
          });
        } catch (err) {
          if (err instanceof PromotionSkip) {
            items.push({
              entityId: entity.id,
              entityType: entity.entityType,
              status: "skipped",
              reason: err.message,
            });
            continue;
          }
          throw err;
        }
      }
    },
    { timeout: 20_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  return {
    uploadId,
    promoted: items.filter((i) => i.status === "promoted").length,
    skipped: items.filter((i) => i.status === "skipped").length,
    already: items.filter((i) => i.status === "already").length,
    items,
  };
}
