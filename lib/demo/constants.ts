export const DEMO_USER_EMAIL =
  process.env.DEMO_USER_EMAIL?.trim() || "demo@pilotys.io";

export const DEMO_FLAG_COOKIE = "flowpilot_demo_mode";

export const DEMO_ONBOARDING_STEPS = [
  "create_project",
  "create_meeting",
  "analyze_meeting",
  "create_decisions",
  "create_actions",
  "follow_calendar",
] as const;
