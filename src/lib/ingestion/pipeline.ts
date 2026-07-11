import {
  InputMethod,
  Prisma,
  ScreenType,
  UploadStatus,
  type Upload,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getVision } from "@/lib/ai";
import { detectScreenType } from "./detector";
import { getParser } from "./registry";
import { getDomain } from "./domains";
import { DETECTION_MIN } from "./confidence";
import type { ExtractedCandidate, ParseContext, Parser } from "./types";
import "./parsers"; // side-effect: registers all parsers
import "./domains"; // side-effect: registers all domain handlers

export interface ProcessResult {
  uploadId: string;
  status: UploadStatus;
  screenType: string;
  inputMethod: InputMethod;
  domain: string | null;
  detectionConfidence: number | null;
  parseConfidence?: number;
  entityCount?: number;
  message?: string;
}

/**
 * Detect -> parse -> stage (or, for manual uploads, validate -> stage). Runs the
 * ingestion pipeline for one upload and writes the results to the staging tables
 * (ParseResult + ExtractedEntity). Canonical promotion happens later (after
 * human validation); this never mutates canonical tables. Idempotent: an
 * already-processed upload is skipped unless `force` is set.
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
      inputMethod: upload.inputMethod,
      domain: upload.domain,
      detectionConfidence: upload.detectionConfidence,
      message: "Already processed; pass force=true to re-run.",
    };
  }

  try {
    // Re-processing: clear prior staging for this upload.
    if (opts.force) {
      await prisma.parseResult.deleteMany({ where: { uploadId } });
    }

    return upload.inputMethod === InputMethod.MANUAL
      ? await processManual(upload)
      : await processScreenshot(upload);
  } catch (err) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.FAILED },
    });
    throw err;
  }
}

/**
 * Manual path: no vision. Validate the typed payload against the domain's Zod
 * schema and stage the resulting candidates directly (confidence 1.0).
 */
async function processManual(upload: Upload): Promise<ProcessResult> {
  if (!upload.domain) throw new Error("Manual upload is missing a domain.");
  const handler = getDomain(upload.domain);
  if (!handler) throw new Error(`No domain handler for ${upload.domain}.`);
  if (!handler.manualSchema) {
    throw new Error(`Domain ${upload.domain} does not support manual input.`);
  }

  const parsed = handler.manualSchema.parse(upload.manualPayload ?? {});
  const entities: ExtractedCandidate[] = handler.buildManualEntities
    ? handler.buildManualEntities(parsed)
    : [
        {
          entityType: handler.entityTypes[0] ?? "Unknown",
          payload: parsed as Record<string, unknown>,
          confidence: 1,
        },
      ];

  await persistParse(upload.id, {
    screenType: handler.screenshotScreenType ?? ScreenType.UNKNOWN,
    parserVersion: `manual:${upload.domain}`,
    data: parsed as Record<string, unknown>,
    confidence: 1,
    entities,
  });

  const updated = await prisma.upload.update({
    where: { id: upload.id },
    data: { status: UploadStatus.NEEDS_REVIEW },
  });

  return {
    uploadId: upload.id,
    status: updated.status,
    screenType: updated.screenType,
    inputMethod: upload.inputMethod,
    domain: upload.domain,
    detectionConfidence: null,
    parseConfidence: 1,
    entityCount: entities.length,
  };
}

/**
 * Screenshot path (vision). If the upload's domain pins a screen type, route
 * straight to that parser and skip auto-detection. Otherwise fall back to the
 * detector and route by the detected screen type.
 */
async function processScreenshot(upload: Upload): Promise<ProcessResult> {
  const bytes = await getStorage().get(upload.storageKey);
  const ctx: ParseContext = {
    imageBase64: bytes.toString("base64"),
    mediaType: upload.mimeType,
    vision: getVision(),
  };

  // Domain-pinned: skip detection when the handler names a screen type with a
  // registered parser (faster, more reliable).
  const handler = upload.domain ? getDomain(upload.domain) : undefined;
  if (handler?.screenshotScreenType) {
    const parser = getParser(handler.screenshotScreenType);
    if (parser) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          screenType: handler.screenshotScreenType,
          detectionConfidence: 1,
          status: UploadStatus.PARSING,
        },
      });
      return stageWithParser(upload, parser, handler.screenshotScreenType, ctx, 1);
    }
    // No parser registered for the pinned type -> fall through to detection.
  }

  // Fallback: detect the screen type, then route.
  await prisma.upload.update({
    where: { id: upload.id },
    data: { status: UploadStatus.DETECTING },
  });
  const detection = await detectScreenType(ctx);
  const parser = getParser(detection.screenType);

  if (!parser || detection.confidence < DETECTION_MIN) {
    const updated = await prisma.upload.update({
      where: { id: upload.id },
      data: {
        screenType: detection.screenType,
        detectionConfidence: detection.confidence,
        status: UploadStatus.NEEDS_REVIEW,
      },
    });
    return {
      uploadId: upload.id,
      status: updated.status,
      screenType: updated.screenType,
      inputMethod: upload.inputMethod,
      domain: upload.domain,
      detectionConfidence: detection.confidence,
      message: parser
        ? "Detection confidence below threshold; needs manual screen-type review."
        : `No parser registered for ${detection.screenType}; needs manual review.`,
    };
  }

  await prisma.upload.update({
    where: { id: upload.id },
    data: {
      screenType: detection.screenType,
      detectionConfidence: detection.confidence,
      status: UploadStatus.PARSING,
    },
  });
  return stageWithParser(upload, parser, detection.screenType, ctx, detection.confidence);
}

/** Run a parser over the image and persist its staging output. */
async function stageWithParser(
  upload: Upload,
  parser: Parser,
  screenType: ScreenType,
  ctx: ParseContext,
  detectionConfidence: number
): Promise<ProcessResult> {
  const parsed = await parser.parse(ctx);

  await persistParse(upload.id, {
    screenType,
    parserVersion: parser.version,
    data: parsed.data,
    confidence: parsed.confidence,
    entities: parsed.entities,
  });

  const updated = await prisma.upload.update({
    where: { id: upload.id },
    data: { status: UploadStatus.NEEDS_REVIEW },
  });

  return {
    uploadId: upload.id,
    status: updated.status,
    screenType,
    inputMethod: upload.inputMethod,
    domain: upload.domain,
    detectionConfidence,
    parseConfidence: parsed.confidence,
    entityCount: parsed.entities.length,
  };
}

/** Write a ParseResult + its ExtractedEntity candidates. Never canonical. */
async function persistParse(
  uploadId: string,
  input: {
    screenType: ScreenType;
    parserVersion: string;
    data: Record<string, unknown>;
    confidence: number;
    entities: ExtractedCandidate[];
  }
): Promise<void> {
  await prisma.parseResult.create({
    data: {
      uploadId,
      screenType: input.screenType,
      parserVersion: input.parserVersion,
      rawData: input.data as Prisma.InputJsonValue,
      confidence: input.confidence,
      entities: {
        create: input.entities.map((e) => ({
          entityType: e.entityType,
          payload: e.payload as Prisma.InputJsonValue,
          confidence: e.confidence,
        })),
      },
    },
  });
}
