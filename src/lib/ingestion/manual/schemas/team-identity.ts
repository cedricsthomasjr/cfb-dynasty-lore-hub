import { z } from "zod";

/**
 * Manual payload for the TEAM_IDENTITY domain — name / mascot / colors typed by
 * hand. Every field is optional but at least one must be present.
 */
export const teamIdentityManualSchema = z
  .object({
    name: z.string().min(1).optional(),
    nickname: z.string().min(1).optional(),
    abbreviation: z.string().min(1).optional(),
    primaryColor: z.string().min(1).optional(),
    secondaryColor: z.string().min(1).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x != null && x !== ""), {
    message: "Provide at least one identity field.",
  });

export type TeamIdentityManual = z.infer<typeof teamIdentityManualSchema>;
