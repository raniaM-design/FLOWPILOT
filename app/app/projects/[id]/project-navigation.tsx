"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderKanban, Map, GanttChart, LayoutGrid } from "lucide-react";

interface ProjectNavigationProps {
  projectId: string;
}

export function ProjectNavigation({ projectId }: ProjectNavigationProps) {
  const pathname = usePathname();
  const isKanban = pathname === `/app/projects/${projectId}/kanban`;
  const isRoadmap = pathname === `/app/projects/${projectId}/roadmap`;
  const isGantt = pathname === `/app/projects/${projectId}/gantt`;
  const isBoard = pathname === `/app/projects/${projectId}/board`;
  const isOverview = pathname === `/app/projects/${projectId}`;

  const tabClass = (isActive: boolean) =>
    cn(
      "flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-300 ease-out flex-shrink-0 sm:flex-1 sm:min-w-0",
      isActive
        ? "bg-[hsl(var(--brand))] text-white shadow-sm" /* remplissage couleur marque */
        : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100"
    );

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden p-2">
      <div className="flex items-stretch gap-1 overflow-x-auto">
        <Link href={`/app/projects/${projectId}`} className={tabClass(isOverview)}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Vue d&apos;ensemble</span>
          <span className="sm:hidden">Vue</span>
        </Link>
        <Link href={`/app/projects/${projectId}/kanban`} className={tabClass(isKanban)}>
          <FolderKanban className="h-4 w-4 shrink-0" />
          Kanban
        </Link>
        <Link href={`/app/projects/${projectId}/roadmap`} className={tabClass(isRoadmap)}>
          <Map className="h-4 w-4 shrink-0" />
          Roadmap
        </Link>
        <Link href={`/app/projects/${projectId}/gantt`} className={tabClass(isGantt)}>
          <GanttChart className="h-4 w-4 shrink-0" />
          Gantt
        </Link>
        <Link href={`/app/projects/${projectId}/board`} className={tabClass(isBoard)}>
          <LayoutGrid className="h-4 w-4 shrink-0" />
          Board
        </Link>
      </div>
    </div>
  );
}

