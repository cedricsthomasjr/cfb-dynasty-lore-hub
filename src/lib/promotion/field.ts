/** Safe readers for JSON entity payloads (Record<string, unknown>). */

export function str(
  p: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

export function int(
  p: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  }
  return undefined;
}

export function num(
  p: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}
