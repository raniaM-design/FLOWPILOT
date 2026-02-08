"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderKanban, Map } from "lucide-react";

interface ProjectNavigationProps {
  projectId: string;
}

export function ProjectNavigation({ projectId }: ProjectNavigationProps) {
  const pathname = usePathname();
  const isKanban = pathname === `/app/projects/${projectId}/kanban`;
  const isRoadmap = pathname === `/app/projects/${projectId}/roadmap`;
  const isOverview = pathname === `/app/projects/${projectId}`;

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
      <Link
        href={`/app/projects/${projectId}`}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0",
          isOverview
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Vue d'ensemble</span>
        <span className="sm:hidden">Vue</span>
      </Link>
      <Link
        href={`/app/projects/${projectId}/kanban`}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0",
          isKanban
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Kanban
      </Link>
      <Link
        href={`/app/projects/${projectId}/roadmap`}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0",
          isRoadmap
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Roadmap
      </Link>
    </div>
  );
}

