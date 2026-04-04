/**
 * Titre court affiché dans le header mobile (centre).
 */
export function resolveMobilePageTitle(
  pathname: string,
  t: (key: string) => string,
): string {
  const s = pathname.split("/").filter(Boolean);
  if (s.length === 1 && s[0] === "app") return t("titles.dashboard");
  if (s[0] !== "app") return t("titles.details");

  const sec = s[1];
  const third = s[2];
  const fourth = s[3];

  if (sec === "projects") {
    if (!third) return t("titles.projects");
    if (third === "new") return t("titles.newProject");
    if (fourth === "kanban") return t("titles.kanban");
    if (fourth === "roadmap") return t("titles.roadmap");
    if (fourth === "gantt") return t("titles.gantt");
    if (fourth === "board") return t("titles.board");
    return t("titles.project");
  }
  if (sec === "meetings") {
    if (!third) return t("titles.meetings");
    if (third === "new") return t("titles.newMeeting");
    if (third === "analyze") return t("titles.analyze");
    if (fourth === "analyze") return t("titles.analyze");
    return t("titles.details");
  }
  if (sec === "actions") {
    if (!third) return t("titles.actions");
    if (third === "new") return t("titles.newAction");
    return t("titles.details");
  }
  if (sec === "decisions") {
    if (!third) return t("titles.decisions");
    if (third === "new") return t("titles.newDecision");
    if (third === "risk") return t("titles.decisions");
    return t("titles.details");
  }
  if (sec === "calendar") return t("titles.calendar");
  if (sec === "review") return t("titles.review");
  if (sec === "integrations") return t("titles.integrations");
  if (sec === "company") return t("titles.company");
  if (sec === "preferences") return t("titles.preferences");
  if (sec === "profile") return t("titles.profile");
  if (sec === "standup") return t("titles.standup");
  if (sec === "settings") {
    if (third === "usage") return t("titles.usage");
    if (third === "billing") return t("titles.billing");
    return t("titles.settings");
  }
  if (sec === "account") {
    if (third === "subscription") return t("titles.subscription");
    if (third === "billing") return t("titles.billing");
    return t("titles.settings");
  }
  if (sec === "admin" || sec === "support") return t("titles.support");
  return t("titles.details");
}

/** Afficher le bouton retour (page secondaire : plus de 2 segments après la racine /app/section/...). */
export function shouldShowMobileBack(pathname: string): boolean {
  const s = pathname.split("/").filter(Boolean);
  if (s.length <= 1) return false;
  if (s.length === 2) return false;
  return true;
}
