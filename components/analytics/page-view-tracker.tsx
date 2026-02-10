"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Composant pour tracker automatiquement les vues de pages
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Ne tracker que les pages de l'application (pas les API routes)
    if (!pathname || pathname.startsWith("/api")) {
      return;
    }

    // Enregistrer la vue
    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: pathname,
            referer: document.referrer || null,
          }),
        });
      } catch (error) {
        // Ignorer les erreurs silencieusement pour ne pas bloquer l'application
        console.debug("[PageViewTracker] Erreur de tracking:", error);
      }
    };

    // Délai pour éviter de tracker les changements de route trop rapides
    const timeoutId = setTimeout(trackPageView, 500);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

