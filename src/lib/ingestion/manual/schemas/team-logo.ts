import { z } from "zod";

/**
 * Manual payload for the TEAM_LOGO domain. The user supplies a logo URL rather
 * than a screenshot. This only stages a TeamLogo candidate — writing it onto
 * Team.logoUrl is canonical promotion (Phase 3).
 */
export const teamLogoManualSchema = z.object({
  logoUrl: z.string().url(),
  source: z.string().optional(),
});

export type TeamLogoManual = z.infer<typeof teamLogoManualSchema>;
