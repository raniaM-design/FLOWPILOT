"use client";

import { useEffect } from "react";
import { getUserPreferences } from "@/lib/user-preferences";

/**
 * Composant Provider pour appliquer les préférences utilisateur au chargement
 * Applique reduceMotion si activé
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefs = getUserPreferences();
    
    // Appliquer reduceMotion si activé
    if (prefs.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, []);

  return <>{children}</>;
}

