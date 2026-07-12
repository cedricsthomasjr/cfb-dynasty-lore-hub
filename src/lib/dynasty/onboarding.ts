/**
 * The onboarding funnel, in one place. A membership advances:
 *   no team → pick a team → no schedule → build a schedule → dashboard.
 * Both the server actions and the page guards route through this so the order
 * can't drift between them.
 */
export interface OnboardingState {
  controlledTeamId: string | null;
  currentWeekId: string | null;
}

export const ONBOARDING_TEAM = "/onboarding/team";
export const ONBOARDING_SCHEDULE = "/onboarding/schedule";
export const DASHBOARD = "/dashboard";

export function onboardingNextStep(state: OnboardingState): string {
  if (!state.controlledTeamId) return ONBOARDING_TEAM;
  if (!state.currentWeekId) return ONBOARDING_SCHEDULE;
  return DASHBOARD;
}
