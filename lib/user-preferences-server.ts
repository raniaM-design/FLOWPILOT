/**
 * Gestion des préférences utilisateur côté serveur (lecture des cookies)
 * Lit les cookies individuels: flowpilot_focusMode et flowpilot_reduceMotion
 */

import { cookies } from "next/headers";

interface UserPreferences {
  focusMode: boolean;
  reduceMotion: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  focusMode: false,
  reduceMotion: false,
};

/**
 * Récupère les préférences utilisateur depuis les cookies (côté serveur)
 * Lit les cookies individuels flowpilot_focusMode et flowpilot_reduceMotion
 */
export async function getUserPreferencesServer(): Promise<UserPreferences> {
  const cookieStore = await cookies();
  
  const focusModeCookie = cookieStore.get("flowpilot_focusMode")?.value;
  const reduceMotionCookie = cookieStore.get("flowpilot_reduceMotion")?.value;

  const focusMode = focusModeCookie === "true";
  const reduceMotion = reduceMotionCookie === "true";

  return {
    focusMode,
    reduceMotion,
  };
}

/**
 * Vérifie si le focus mode est activé (côté serveur)
 */
export async function isFocusModeEnabledServer(): Promise<boolean> {
  const prefs = await getUserPreferencesServer();
  return prefs.focusMode;
}

/**
 * Vérifie si la réduction de mouvement est activée (côté serveur)
 */
export async function isReduceMotionEnabledServer(): Promise<boolean> {
  const prefs = await getUserPreferencesServer();
  return prefs.reduceMotion;
}

