"use client";

import { usePathname } from "next/navigation";

/**
 * Sur Kanban, Roadmap, Gantt : pas de container pour que le contenu prenne toute la largeur.
 * Sur les autres pages : container centré avec max-w-7xl.
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

interface ConditionalContainerProps {
  children: React.ReactNode;
}

export function ConditionalContainer({ children }: ConditionalContainerProps) {
  const pathname = usePathname();
  const fullWidth = isFullWidthPage(pathname);

  if (fullWidth) {
    return <div className="w-full min-w-0 flex-1">{children}</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 flex-1">
      {children}
    </div>
  );
}
