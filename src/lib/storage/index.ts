import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage abstraction. Phase 1 ships a local-disk driver; swapping to S3/R2
 * later means implementing this same interface — route handlers never change.
 */
export interface StoredObject {
  storageKey: string;
  publicUrl: string | null;
  contentHash: string;
  sizeBytes: number;
}

export interface StorageDriver {
  put(input: {
    bytes: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<StoredObject>;
  /** Read stored bytes back by the storageKey returned from put(). */
  get(storageKey: string): Promise<Buffer>;
}

function hashContent(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function extFor(originalName: string, mimeType: string): string {
  const fromName = path.extname(originalName);
  if (fromName) return fromName;
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

class LocalStorageDriver implements StorageDriver {
  private readonly baseDir: string;
  private readonly publicDir: string;

  constructor() {
    this.baseDir = process.env.STORAGE_LOCAL_DIR ?? "./storage";
    this.publicDir = process.env.UPLOAD_PUBLIC_DIR ?? "./public/uploads";
  }

  async put(input: {
    bytes: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<StoredObject> {
    const contentHash = hashContent(input.bytes);
    const ext = extFor(input.originalName, input.mimeType);
    const fileName = `${contentHash}${ext}`;

    // Original bytes -> private storage dir (content-addressed for idempotency).
    const absBase = path.resolve(process.cwd(), this.baseDir);
    await mkdir(absBase, { recursive: true });
    const storagePath = path.join(absBase, fileName);
    await writeFile(storagePath, input.bytes);

    // A servable preview copy under /public/uploads.
    const absPublic = path.resolve(process.cwd(), this.publicDir);
    await mkdir(absPublic, { recursive: true });
    await writeFile(path.join(absPublic, fileName), input.bytes);

    return {
      storageKey: path.join(this.baseDir, fileName),
      publicUrl: `/uploads/${fileName}`,
      contentHash,
      sizeBytes: input.bytes.byteLength,
    };
  }

  async get(storageKey: string): Promise<Buffer> {
    const abs = path.resolve(process.cwd(), storageKey);
    return readFile(abs);
  }
}

export function getStorage(): StorageDriver {
  // Only "local" is implemented in Phase 1; the switch is the extension seam.
  switch (process.env.STORAGE_DRIVER) {
    case "local":
    default:
      return new LocalStorageDriver();
  }
}
