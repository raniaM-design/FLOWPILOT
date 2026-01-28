"use client";

import { ReactNode } from "react";

/**
 * Composant Client wrapper pour ActionStatusButtons
 * Gère le stopPropagation pour empêcher la navigation quand on clique sur les boutons
 */
export function ActionStatusWrapper({ children }: { children: ReactNode }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

