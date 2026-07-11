import { Prisma, UploadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getVision } from "@/lib/ai";
import { detectScreenType } from "./detector";
import { getParser } from "./registry";
import { DETECTION_MIN } from "./confidence";
import type { ParseContext } from "./types";
import "./parsers"; // side-effect: registers all parsers

export interface ProcessResult {
  uploadId: string;
  status: UploadStatus;
  screenType: string;
  detectionConfidence: number | null;
  parseConfidence?: number;
  entityCount?: number;
  message?: string;
}

/**
 * Detect -> parse -> stage. Runs the vision pipeline for one upload and writes
 * the results to the staging tables (ParseResult + ExtractedEntity). Canonical
 * promotion happens later (after human validation); this never mutates
 * canonical tables. Idempotent: an already-processed upload is skipped unless
 * `force` is set.
 */
export async function processUpload(
  uploadId: string,
  opts: { force?: boolean } = {}
): Promise<ProcessResult> {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: { _count: { select: { parseResults: true } } },
  });
  if (!upload) throw new Error(`Upload ${uploadId} not found.`);

  if (!opts.force && upload._count.parseResults > 0) {
    return {
      uploadId,
      status: upload.status,
      screenType: upload.screenType,
      detectionConfidence: upload.detectionConfidence,
      message: "Already processed; pass force=true to re-run.",
    };
  }

  try {
    // Re-processing: clear prior staging for this upload.
    if (opts.force) {
      await prisma.parseResult.deleteMany({ where: { uploadId } });
    }

    const bytes = await getStorage().get(upload.storageKey);
    const ctx: ParseContext = {
      imageBase64: bytes.toString("base64"),
      mediaType: upload.mimeType,
      vision: getVision(),
    };

    // 1. Detect the screen type.
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.DETECTING },
    });
    const detection = await detectScreenType(ctx);

    // 2. Route to a parser.
    const parser = getParser(detection.screenType);
    if (!parser || detection.confidence < DETECTION_MIN) {
      const updated = await prisma.upload.update({
        where: { id: uploadId },
        data: {
          screenType: detection.screenType,
          detectionConfidence: detection.confidence,
          status: UploadStatus.NEEDS_REVIEW,
        },
      });
      return {
        uploadId,
        status: updated.status,
        screenType: updated.screenType,
        detectionConfidence: detection.confidence,
        message: parser
          ? "Detection confidence below threshold; needs manual screen-type review."
          : `No parser registered for ${detection.screenType}; needs manual review.`,
      };
    }

    // 3. Parse into structured candidates.
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        screenType: detection.screenType,
        detectionConfidence: detection.confidence,
        status: UploadStatus.PARSING,
      },
    });
    const parsed = await parser.parse(ctx);

    // 4. Persist to staging (ParseResult + ExtractedEntity). Never canonical.
    await prisma.parseResult.create({
      data: {
        uploadId,
        screenType: detection.screenType,
        parserVersion: parser.version,
        rawData: parsed.data as Prisma.InputJsonValue,
        confidence: parsed.confidence,
        entities: {
          create: parsed.entities.map((e) => ({
            entityType: e.entityType,
            payload: e.payload as Prisma.InputJsonValue,
            confidence: e.confidence,
          })),
        },
      },
    });

    // 5. Everything awaits human validation before canonical promotion.
    const updated = await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.NEEDS_REVIEW },
    });

    return {
      uploadId,
      status: updated.status,
      screenType: detection.screenType,
      detectionConfidence: detection.confidence,
      parseConfidence: parsed.confidence,
      entityCount: parsed.entities.length,
    };
  } catch (err) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.FAILED },
    });
    throw err;
  }
}
