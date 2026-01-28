"use client";

import { useEffect, useState, createContext, useContext } from "react";

const FULLSCREEN_STORAGE_KEY = "kanban-fullscreen";

interface FullscreenContextType {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error("useFullscreen must be used within KanbanFullscreenWrapper");
  }
  return context;
}

interface KanbanFullscreenWrapperProps {
  projectId: string;
  children: React.ReactNode;
}

export function KanbanFullscreenWrapper({
  projectId,
  children,
}: KanbanFullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Charger l'état depuis localStorage
  useEffect(() => {
    const storageKey = `${FULLSCREEN_STORAGE_KEY}-${projectId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved === "true") {
      setIsFullscreen(true);
    }
  }, [projectId]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Appliquer/retirer les styles plein écran
  useEffect(() => {
    const storageKey = `${FULLSCREEN_STORAGE_KEY}-${projectId}`;
    
    if (isFullscreen) {
      // Trouver la sidebar (premier div avec w-64 dans le layout)
      const layoutContainer = document.querySelector('div.flex.h-screen') as HTMLElement;
      if (layoutContainer) {
        const sidebar = layoutContainer.firstElementChild as HTMLElement;
        if (sidebar && sidebar.classList.contains("w-64")) {
          sidebar.style.display = "none";
        }
      }

      // Trouver et masquer le topbar (dans le deuxième enfant du layout)
      if (layoutContainer) {
        const mainSection = layoutContainer.children[1] as HTMLElement;
        if (mainSection) {
          const topbar = mainSection.firstElementChild as HTMLElement;
          if (topbar) {
            topbar.style.display = "none";
          }
        }
      }

      // Masquer le footer
      const footer = document.querySelector("footer") as HTMLElement;
      if (footer) {
        footer.style.display = "none";
      }

      // Élargir le contenu principal
      const main = document.querySelector("main") as HTMLElement;
      if (main) {
        main.style.marginLeft = "0";
        main.style.width = "100%";
        main.style.maxWidth = "100%";
        main.style.paddingLeft = "0";
        main.style.paddingRight = "0";
      }

      // Élargir le conteneur interne
      const container = main?.querySelector(".container") as HTMLElement;
      if (container) {
        container.style.maxWidth = "100%";
        container.style.paddingLeft = "2rem";
        container.style.paddingRight = "2rem";
      }

      localStorage.setItem(storageKey, "true");
    } else {
      // Restaurer la sidebar
      const layoutContainer = document.querySelector('div.flex.h-screen') as HTMLElement;
      if (layoutContainer) {
        const sidebar = layoutContainer.firstElementChild as HTMLElement;
        if (sidebar && sidebar.classList.contains("w-64")) {
          sidebar.style.display = "";
        }
      }

      // Restaurer le topbar
      if (layoutContainer) {
        const mainSection = layoutContainer.children[1] as HTMLElement;
        if (mainSection) {
          const topbar = mainSection.firstElementChild as HTMLElement;
          if (topbar) {
            topbar.style.display = "";
          }
        }
      }

      // Restaurer le footer
      const footer = document.querySelector("footer") as HTMLElement;
      if (footer) {
        footer.style.display = "";
      }

      // Restaurer le contenu principal
      const main = document.querySelector("main") as HTMLElement;
      if (main) {
        main.style.marginLeft = "";
        main.style.width = "";
        main.style.maxWidth = "";
        main.style.paddingLeft = "";
        main.style.paddingRight = "";
      }

      // Restaurer le conteneur interne
      const container = main?.querySelector(".container") as HTMLElement;
      if (container) {
        container.style.maxWidth = "";
        container.style.paddingLeft = "";
        container.style.paddingRight = "";
      }

      localStorage.setItem(storageKey, "false");
    }

    // Cleanup au démontage
    return () => {
      const layoutContainer = document.querySelector('div.flex.h-screen') as HTMLElement;
      if (layoutContainer) {
        const sidebar = layoutContainer.firstElementChild as HTMLElement;
        if (sidebar && sidebar.classList.contains("w-64")) {
          sidebar.style.display = "";
        }
        const mainSection = layoutContainer.children[1] as HTMLElement;
        if (mainSection) {
          const topbar = mainSection.firstElementChild as HTMLElement;
          if (topbar) {
            topbar.style.display = "";
          }
        }
      }
      const footer = document.querySelector("footer") as HTMLElement;
      if (footer) {
        footer.style.display = "";
      }
      const main = document.querySelector("main") as HTMLElement;
      if (main) {
        main.style.marginLeft = "";
        main.style.width = "";
        main.style.maxWidth = "";
        main.style.paddingLeft = "";
        main.style.paddingRight = "";
      }
      const container = main?.querySelector(".container") as HTMLElement;
      if (container) {
        container.style.maxWidth = "";
        container.style.paddingLeft = "";
        container.style.paddingRight = "";
      }
    };
  }, [isFullscreen, projectId]);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggleFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
}

