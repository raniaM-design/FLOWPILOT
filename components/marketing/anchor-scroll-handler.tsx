"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Composant pour gérer le scroll automatique vers les ancres au chargement de la page
 */
export function AnchorScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Fonction pour gérer le scroll vers l'ancre
    const scrollToAnchor = () => {
      const hash = window.location.hash;
      if (hash && pathname === "/") {
        const elementId = hash.replace("#", "");
        const element = document.getElementById(elementId);
        if (element) {
          // Calculer la position avec offset pour le header sticky
          const headerOffset = 80; // Hauteur approximative du header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    };

    // Attendre que le DOM soit complètement chargé
    const timeoutId = setTimeout(() => {
      scrollToAnchor();
    }, 100);

    // Écouter les changements de hash (navigation avec ancres)
    window.addEventListener("hashchange", scrollToAnchor);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("hashchange", scrollToAnchor);
    };
  }, [pathname]);

  return null;
}

