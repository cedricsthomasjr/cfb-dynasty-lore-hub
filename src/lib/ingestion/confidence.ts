/**
 * Confidence thresholds that gate the staging pipeline. Vision is
 * probabilistic, so nothing reaches canonical tables automatically — but these
 * thresholds decide whether an upload can be auto-parsed and flag low-quality
 * extractions for closer human attention in the review queue.
 */

/** Below this detection confidence, we don't trust the screen-type guess. */
export const DETECTION_MIN = 0.6;

/** Parse-level confidence below this is surfaced prominently for review. */
export const PARSE_REVIEW_THRESHOLD = 0.75;

/** Entity-level confidence below this marks the row as low-confidence. */
export const ENTITY_REVIEW_THRESHOLD = 0.7;

export function isLowConfidence(value: number): boolean {
  return value < ENTITY_REVIEW_THRESHOLD;
}
