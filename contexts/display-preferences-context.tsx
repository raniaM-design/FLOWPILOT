"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, ReactNode } from "react";

export interface DisplayPreferences {
  reduceAnimations: boolean;
  displayMode: "standard" | "simplified";
  density: "comfort" | "standard" | "compact";
}

interface DisplayPreferencesContextType {
  preferences: DisplayPreferences;
  isLoading: boolean;
  updatePreferences: (newPreferences: Partial<DisplayPreferences>) => Promise<void>;
  applyPreferences: (prefs: DisplayPreferences) => void;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  reduceAnimations: false,
  displayMode: "standard",
  density: "standard",
};

const DisplayPreferencesContext = createContext<DisplayPreferencesContextType | undefined>(
  undefined
);

/**
 * Applique les préférences d'affichage au DOM
 */
function applyPreferencesToDOM(prefs: DisplayPreferences) {
  if (typeof window === "undefined") return;
  
  const html = document.documentElement;

  // 1. Réduire les animations
  if (prefs.reduceAnimations) {
    html.classList.add("reduce-motion");
  } else {
    html.classList.remove("reduce-motion");
  }

  // 2. Mode d'affichage
  html.classList.remove("display-mode-standard", "display-mode-simplified");
  html.classList.add(`display-mode-${prefs.displayMode}`);

  // 3. Densité
  html.classList.remove("density-comfort", "density-standard", "density-compact");
  html.classList.add(`density-${prefs.density}`);
}

export function DisplayPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: ReactNode;
  initialPreferences?: DisplayPreferences;
}) {
  const [preferences, setPreferences] = useState<DisplayPreferences>(
    initialPreferences || DEFAULT_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(!initialPreferences);

  // Appliquer les préférences immédiatement au montage (synchrone, avant le paint)
  // Utilise useLayoutEffect pour éviter le flash de contenu
  useLayoutEffect(() => {
    if (initialPreferences) {
      applyPreferencesToDOM(initialPreferences);
    } else {
      // Appliquer les préférences par défaut même si pas encore chargées
      applyPreferencesToDOM(DEFAULT_PREFERENCES);
    }
  }, [initialPreferences]);

  // Charger les préférences au montage si non fournies
  useEffect(() => {
    if (!initialPreferences) {
      fetch("/api/user/preferences/display")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            const prefs: DisplayPreferences = {
              reduceAnimations: data.reduceAnimations ?? false,
              displayMode: data.displayMode ?? "standard",
              density: data.density ?? "standard",
            };
            setPreferences(prefs);
            applyPreferencesToDOM(prefs);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des préférences:", error);
          setIsLoading(false);
        });
    }
  }, [initialPreferences]);

  // Appliquer les préférences quand elles changent
  useEffect(() => {
    applyPreferencesToDOM(preferences);
  }, [preferences]);

  const applyPreferences = useCallback((prefs: DisplayPreferences) => {
    setPreferences(prefs);
    applyPreferencesToDOM(prefs);
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<DisplayPreferences>) => {
      // Mise à jour optimiste des préférences
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      applyPreferencesToDOM(updated);

      // Sauvegarder en backend
      try {
        const response = await fetch("/api/user/preferences/display", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updated),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la sauvegarde");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des préférences:", error);
        // Revenir aux valeurs précédentes en cas d'erreur
        setPreferences(preferences);
        applyPreferencesToDOM(preferences);
        throw error;
      }
    },
    [preferences]
  );

  return (
    <DisplayPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        applyPreferences,
      }}
    >
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useDisplayPreferences must be used within a DisplayPreferencesProvider"
    );
  }
  return context;
}

