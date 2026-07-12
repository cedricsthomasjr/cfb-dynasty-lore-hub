"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { setActiveDynastyCookie } from "./active";
import { createDynasty, joinDynasty, BootstrapError } from "./bootstrap";
import { createSchedule, type ScheduleEntry } from "./schedule";
import type { WeekTypeName } from "./schedule-weeks";
import { onboardingNextStep } from "./onboarding";

export interface DynastyActionState {
  error?: string;
}

/**
 * "Dive into" one of the user's dynasties: mark it active and route to the right
 * onboarding step — pick a team, build the schedule, or the dashboard.
 */
export async function diveIntoDynasty(formData: FormData): Promise<void> {
  const user = await requireUser();
  const dynastyId = String(formData.get("dynastyId") ?? "");

  const membership = await prisma.dynastyMembership.findUnique({
    where: { userId_dynastyId: { userId: user.id, dynastyId } },
    include: { dynasty: { select: { currentWeekId: true } } },
  });
  if (!membership) redirect("/");

  setActiveDynastyCookie(dynastyId);
  redirect(
    onboardingNextStep({
      controlledTeamId: membership.controlledTeamId,
      currentWeekId: membership.dynasty.currentWeekId,
    })
  );
}

/** Create a new dynasty, make it active, and head to team selection. */
export async function createDynastyAction(
  _prev: DynastyActionState,
  formData: FormData
): Promise<DynastyActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Dynasty name is required." };

  let dynastyId: string;
  try {
    const result = await createDynasty({ name, userId: user.id });
    dynastyId = result.dynasty.id;
  } catch (err) {
    if (err instanceof BootstrapError) return { error: err.message };
    throw err;
  }

  setActiveDynastyCookie(dynastyId);
  redirect("/onboarding/team");
}

/**
 * Build the active dynasty's schedule from the manual builder: create the season
 * + week structure, write the controlled team's SCHEDULED games, and set the
 * dynasty's current week. Expects a JSON `payload` field:
 *   { year, currentWeekNumber, currentWeekType, entries: [{ weekNumber, opponentTeamId, isHome }] }
 */
export async function createScheduleAction(
  _prev: DynastyActionState,
  formData: FormData
): Promise<DynastyActionState> {
  const user = await requireUser();

  const dynastyId = String(formData.get("dynastyId") ?? "");
  const membership = await prisma.dynastyMembership.findUnique({
    where: { userId_dynastyId: { userId: user.id, dynastyId } },
  });
  if (!membership) return { error: "You are not a member of this dynasty." };
  if (!membership.controlledTeamId) {
    return { error: "Pick your team before building a schedule." };
  }

  let parsed: {
    year: number;
    currentWeekNumber: number;
    currentWeekType: WeekTypeName;
    entries: ScheduleEntry[];
  };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Could not read the schedule form." };
  }

  const entries = (parsed.entries ?? []).filter(
    (e) => e && e.opponentTeamId && Number.isInteger(e.weekNumber)
  );

  try {
    await createSchedule({
      dynastyId,
      teamId: membership.controlledTeamId,
      year: Number(parsed.year),
      entries,
      currentWeekNumber: Number(parsed.currentWeekNumber),
      currentWeekType: parsed.currentWeekType ?? "REGULAR",
    });
  } catch (err) {
    if (err instanceof BootstrapError) return { error: err.message };
    throw err;
  }

  redirect("/dashboard");
}

/** Join an existing dynasty by id (open join), make it active, pick a team. */
export async function joinDynastyAction(
  _prev: DynastyActionState,
  formData: FormData
): Promise<DynastyActionState> {
  const user = await requireUser();
  const dynastyId = String(formData.get("dynastyId") ?? "").trim();
  if (!dynastyId) return { error: "Dynasty ID is required." };

  try {
    await joinDynasty({ dynastyId, userId: user.id });
  } catch (err) {
    if (err instanceof BootstrapError) return { error: err.message };
    throw err;
  }

  setActiveDynastyCookie(dynastyId);
  redirect("/onboarding/team");
}
