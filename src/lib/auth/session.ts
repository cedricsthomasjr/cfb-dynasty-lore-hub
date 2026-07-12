import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Session = a signed httpOnly cookie holding the user id. The HMAC (keyed by
 * AUTH_SECRET) makes the id unforgeable without the secret. This is deliberately
 * simple local auth; a real provider would swap this for its own session.
 * set/clear must only run in Server Actions or Route Handlers (never render).
 */
const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
}

function sign(userId: string): string {
  const mac = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${mac}`;
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(userId).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export function setSession(userId: string): void {
  cookies().set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession(): void {
  cookies().delete(COOKIE);
}

export function getSessionUserId(): string | null {
  const c = cookies().get(COOKIE);
  return c ? verify(c.value) : null;
}
