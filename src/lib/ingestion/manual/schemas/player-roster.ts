import { z } from "zod";
import { ClassYear } from "@prisma/client";

/**
 * Manual payload for the PLAYER_ROSTER domain — a typed list of players on the
 * controlled team. Mirrors the canonical Player columns (all optional except a
 * name). Staged as one Player candidate per row.
 */
const playerRowSchema = z.object({
  name: z.string().min(1),
  position: z.string().optional(),
  jersey: z.number().int().min(0).max(99).optional(),
  classYear: z.enum(ClassYear).optional(),
  heightIn: z.number().int().positive().optional(),
  weightLb: z.number().int().positive().optional(),
  hometown: z.string().optional(),
});

export const playerRosterManualSchema = z.object({
  players: z.array(playerRowSchema).min(1),
});

export type PlayerRosterManual = z.infer<typeof playerRosterManualSchema>;
