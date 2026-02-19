"use client";

import { usePathname } from "next/navigation";

/**
 * Pages en plein écran : Kanban, Roadmap, Gantt d'un projet (y compris print).
 * Sur ces pages, la sidebar est masquée pour que le contenu prenne toute la page.
 */
const FULL_WIDTH_PATTERNS = [
  /^\/app\/projects\/[^/]+\/kanban(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/roadmap(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/gantt(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/board(\/.*)?$/,
];

function isFullWidthPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return FULL_WIDTH_PATTERNS.some((pattern) => pattern.test(pathname));
}

interface ConditionalSidebarWrapperProps {
  children: React.ReactNode;
}

export function ConditionalSidebarWrapper({ children }: ConditionalSidebarWrapperProps) {
  const pathname = usePathname();
  const hideSidebar = isFullWidthPage(pathname);

  if (hideSidebar) {
    return null;
  }

  return <>{children}</>;
}
