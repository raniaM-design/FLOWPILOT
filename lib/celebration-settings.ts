/**
 * Gestion des paramètres de célébration (cookies côté client)
 */

const CELEBRATION_COOKIE_NAME = "flowpilot_celebration_enabled";

/**
 * Vérifie si les célébrations sont activées (côté client uniquement)
 */
export function isCelebrationEnabled(): boolean {
  if (typeof window === "undefined") {
    return false; // SSR: désactivé par défaut
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CELEBRATION_COOKIE_NAME}=`));

  if (!cookie) {
    return true; // Par défaut activé
  }

  return cookie.split("=")[1] === "true";
}

/**
 * Active ou désactive les célébrations (côté client uniquement)
 */
export function setCelebrationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  // Cookie valide 1 an
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  document.cookie = `${CELEBRATION_COOKIE_NAME}=${enabled}; expires=${expires.toUTCString()}; path=/`;
}

