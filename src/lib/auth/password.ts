import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with Node's built-in scrypt — no external dependency, and we
 * never store or log a plaintext password. Format: "scrypt$<saltHex>$<hashHex>".
 */
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
