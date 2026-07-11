export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Gridiron Lore";

export const ACCEPTED_UPLOAD_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function maxUploadBytes(): number {
  const fromEnv = Number(process.env.MAX_UPLOAD_BYTES);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : DEFAULT_MAX_UPLOAD_BYTES;
}
