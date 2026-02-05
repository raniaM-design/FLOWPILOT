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
    <div className="flex items-center gap-1 border-b border-slate-200">
      <Link
        href={`/app/projects/${projectId}`}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
          isOverview
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Vue d'ensemble
      </Link>
      <Link
        href={`/app/projects/${projectId}/kanban`}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
          isKanban
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <FolderKanban className="h-4 w-4" />
        Kanban
      </Link>
      <Link
        href={`/app/projects/${projectId}/roadmap`}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
          isRoadmap
            ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
        )}
      >
        <Map className="h-4 w-4" />
        Roadmap
      </Link>
    </div>
  );
}

