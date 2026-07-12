/**
 * Pure, client-safe week-structure constants (no Prisma import). The string
 * literals here are exactly the WeekType enum values, so they're assignable to
 * Prisma's WeekType on the server while staying importable from client
 * components (the schedule builder).
 */
export type WeekTypeName =
  | "PRESEASON"
  | "REGULAR"
  | "CONFERENCE_CHAMPIONSHIP"
  | "BOWL"
  | "PLAYOFF"
  | "NATIONAL_CHAMPIONSHIP"
  | "OFFSEASON";

/** Regular game weeks the manual builder exposes (CFB 25 numbers Week 0–14). */
export const REGULAR_WEEK_NUMBERS = Array.from({ length: 15 }, (_, i) => i);

/** The full week structure generated for a season, in chronological order. */
export const WEEK_TEMPLATE: { number: number; type: WeekTypeName }[] = [
  ...REGULAR_WEEK_NUMBERS.map((number) => ({
    number,
    type: "REGULAR" as WeekTypeName,
  })),
  { number: 15, type: "CONFERENCE_CHAMPIONSHIP" },
  { number: 16, type: "BOWL" },
  { number: 17, type: "PLAYOFF" },
  { number: 18, type: "NATIONAL_CHAMPIONSHIP" },
  { number: 19, type: "OFFSEASON" },
];

/** Human label for a week in the template. */
export function weekLabel(number: number, type: WeekTypeName): string {
  switch (type) {
    case "REGULAR":
      return `Week ${number}`;
    case "CONFERENCE_CHAMPIONSHIP":
      return "Conference Championships";
    case "BOWL":
      return "Bowl Season";
    case "PLAYOFF":
      return "Playoff";
    case "NATIONAL_CHAMPIONSHIP":
      return "National Championship";
    case "PRESEASON":
      return "Preseason";
    case "OFFSEASON":
      return "Offseason";
    default:
      return `Week ${number}`;
  }
}
