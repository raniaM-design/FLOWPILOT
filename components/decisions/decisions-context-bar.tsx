"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  title: string;
  status: string;
  actions: Array<{
    id: string;
    status: string;
    dueDate: string | null;
  }>;
  meta: {
    risk: {
      level: "GREEN" | "YELLOW" | "RED";
    };
    actionCount: number;
    nextDueDate: Date | null;
    deadlineDisplayState?: "critical" | "to_monitor" | "ok";
  };
}

interface DecisionsContextBarProps {
  decisions: Decision[];
  criticalDays: number;
  monitorDays: number;
}

function LegendPill({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums select-none pointer-events-none",
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function DecisionsContextBar({
  decisions,
  criticalDays,
  monitorDays,
}: DecisionsContextBarProps) {
  const stats = useMemo(() => {
    const total = decisions.length;

    const monitoring = decisions.filter(
      (d) =>
        d.status !== "ARCHIVED" &&
        ((d.meta.deadlineDisplayState ?? "ok") === "critical" ||
          (d.meta.deadlineDisplayState ?? "ok") === "to_monitor"),
    ).length;

    const withoutActions = decisions.filter(
      (d) => d.meta.actionCount === 0 && d.status !== "ARCHIVED",
    ).length;

    return {
      total,
      monitoring,
      withoutActions,
    };
  }, [decisions]);

  if (stats.total === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 flex-1 min-w-0">
        <p className="text-sm text-slate-600 min-w-0">
          <span className="font-semibold text-slate-800 tabular-nums">
            {stats.total}
          </span>{" "}
          décision{stats.total > 1 ? "s" : ""}
          <span className="text-slate-400 mx-1.5">·</span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {stats.monitoring}
          </span>{" "}
          à surveiller
          <span className="text-slate-400 mx-1.5">·</span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {stats.withoutActions}
          </span>{" "}
          sans actions
        </p>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <LegendPill className="border-red-200 bg-red-50 text-red-700">
            <span className="opacity-80">●</span> Critique &lt; {criticalDays}j
          </LegendPill>
          <LegendPill className="border-amber-200 bg-amber-50 text-amber-800">
            <span className="opacity-80">●</span> À surveiller {criticalDays}–{monitorDays}j
          </LegendPill>
          <LegendPill className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <span className="opacity-80">●</span> OK ≥ {monitorDays}j
          </LegendPill>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Aide : états des décisions"
              >
                <HelpCircle className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className="max-w-sm bg-slate-900 px-3 py-2.5 text-xs text-white leading-relaxed"
            >
              <p className="font-medium mb-1.5">États des décisions</p>
              <p className="text-slate-200 mb-2">
                Les pastilles reflètent la proximité de la{" "}
                <strong className="text-white">prochaine échéance</strong> (actions
                non terminées). Tu peux ajuster les seuils dans{" "}
                <Link
                  href="/app/preferences"
                  className="text-white underline underline-offset-2 font-medium hover:text-slate-100"
                >
                  Préférences
                </Link>
                .
              </p>
              <ul className="space-y-1 text-slate-200 border-t border-slate-700 pt-2 mt-2">
                <li>
                  <span className="text-red-300 font-medium">Critique</span> — échéance
                  dans moins de {criticalDays}{" "}
                  jour{criticalDays > 1 ? "s" : ""}
                </li>
                <li>
                  <span className="text-amber-300 font-medium">À surveiller</span> —
                  entre {criticalDays} et {monitorDays} jours
                </li>
                <li>
                  <span className="text-emerald-300 font-medium">OK</span> — au moins{" "}
                  {monitorDays} jour{monitorDays > 1 ? "s" : ""}, ou pas d&apos;échéance
                </li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
