/**
 * Gestion des préférences utilisateur (cookies côté client)
 * TDAH-friendly settings: focusMode et reduceMotion
 * Les cookies sont maintenant stockés individuellement: flowpilot_focusMode et flowpilot_reduceMotion
 */

const FOCUS_MODE_COOKIE_NAME = "flowpilot_focusMode";
const REDUCE_MOTION_COOKIE_NAME = "flowpilot_reduceMotion";

interface UserPreferences {
  focusMode: boolean;
  reduceMotion: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  focusMode: false,
  reduceMotion: false,
};

/**
 * Parse les préférences depuis les cookies (côté client uniquement)
 * Lit les cookies individuels flowpilot_focusMode et flowpilot_reduceMotion
 */
function parsePreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  const cookies = document.cookie.split("; ");
  
  const focusModeCookie = cookies.find((row) => row.startsWith(`${FOCUS_MODE_COOKIE_NAME}=`));
  const reduceMotionCookie = cookies.find((row) => row.startsWith(`${REDUCE_MOTION_COOKIE_NAME}=`));

  let focusMode = false;
  let reduceMotion = false;

  if (focusModeCookie) {
    const value = focusModeCookie.split("=")[1];
    focusMode = value === "true";
  }

  if (reduceMotionCookie) {
    const value = reduceMotionCookie.split("=")[1];
    reduceMotion = value === "true";
  }

  return {
    focusMode,
    reduceMotion,
  };
}

/**
 * Vérifie si le focus mode est activé (côté client uniquement)
 */
export function isFocusModeEnabled(): boolean {
  return parsePreferences().focusMode;
}

/**
 * Vérifie si la réduction de mouvement est activée (côté client uniquement)
 */
export function isReduceMotionEnabled(): boolean {
  return parsePreferences().reduceMotion;
}

/**
 * Met à jour les préférences utilisateur (côté client uniquement)
 * DÉPRÉCIÉ: Utiliser le route handler /app/preferences/actions à la place
 * Conservé pour compatibilité avec le code existant
 */
export function updatePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === "undefined") {
    return;
  }

  const current = parsePreferences();
  const updated: UserPreferences = {
    ...current,
    ...preferences,
  };

  // Cookie valide 1 an
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  // Sauvegarder les cookies individuellement
  if (preferences.focusMode !== undefined) {
    document.cookie = `${FOCUS_MODE_COOKIE_NAME}=${updated.focusMode}; expires=${expires.toUTCString()}; path=/`;
  }

  if (preferences.reduceMotion !== undefined) {
    document.cookie = `${REDUCE_MOTION_COOKIE_NAME}=${updated.reduceMotion}; expires=${expires.toUTCString()}; path=/`;
    
    // Appliquer immédiatement la classe CSS
    if (updated.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }
}

/**
 * Récupère toutes les préférences (côté client uniquement)
 */
export function getUserPreferences(): UserPreferences {
  return parsePreferences();
}

