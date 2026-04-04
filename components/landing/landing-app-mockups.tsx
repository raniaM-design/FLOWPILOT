"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare2,
  ListTodo,
  Users,
  CalendarDays,
  Plug,
  NotebookPen,
  Lock,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MockBrowserChrome({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="ml-1 truncate text-[10px] text-gray-400 sm:text-xs">{url}</span>
      </div>
      {children}
    </div>
  );
}

const SIDEBAR_ICONS = [
  LayoutDashboard,
  FolderKanban,
  CheckSquare2,
  ListTodo,
  Users,
  CalendarDays,
  Plug,
] as const;

export function MockSidebarRail({ activeIndex = 0 }: { activeIndex?: number }) {
  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center gap-1 border-r border-[#1E293B] bg-[#2B3C69] py-2">
      {SIDEBAR_ICONS.map((Icon, i) => (
        <div
          key={i}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            i === activeIndex ? "bg-white/15 text-white" : "text-white/55",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}

/** Aperçu proche du dashboard réel (stats + priorités). */
export function MockDashboardPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex min-h-0 flex-1 bg-[#F8FAFC]", compact && "text-[11px]")}>
      <MockSidebarRail activeIndex={0} />
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium text-emerald-600 sm:text-xs">● En ligne</p>
            <h3
              className={cn(
                "font-bold leading-tight text-slate-900",
                compact ? "text-sm" : "text-base sm:text-lg",
              )}
            >
              Bonjour Sophie 👋
            </h3>
          </div>
        </div>

        <div
          className={cn(
            "mb-3 grid gap-2",
            compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4",
          )}
        >
          {[
            { v: "3", l: "Projets actifs", box: "bg-purple-50 text-purple-700" },
            { v: "60", l: "Tâches en cours", box: "bg-blue-50 text-blue-700" },
            { v: "5", l: "En retard", box: "bg-red-50 text-red-700" },
            { v: "72%", l: "Score de santé", box: "bg-emerald-50 text-emerald-700" },
          ].map((s) => (
            <div
              key={s.l}
              className={cn("rounded-lg p-2 shadow-sm", s.box, compact && "p-1.5")}
            >
              <div className={cn("font-bold tabular-nums", compact ? "text-base" : "text-lg")}>
                {s.v}
              </div>
              <div className="text-[9px] font-medium text-slate-600 sm:text-[10px]">{s.l}</div>
            </div>
          ))}
        </div>

        <p
          className={cn(
            "mb-2 font-semibold text-slate-800",
            compact ? "text-[11px]" : "text-xs sm:text-sm",
          )}
        >
          Mes priorités
        </p>
        <div className="space-y-1.5">
          {[
            {
              title: "Lancer la campagne Q2",
              sub: "Projet Alpha · 4 févr.",
              status: "En retard",
              tone: "bg-red-50 text-red-700 border-red-100",
              Icon: NotebookPen,
            },
            {
              title: "Valider le périmètre MVP",
              sub: "Roadmap · 8 févr.",
              status: "En cours",
              tone: "bg-amber-50 text-amber-800 border-amber-100",
              Icon: Lock,
            },
            ...(compact
              ? []
              : [
                  {
                    title: "Préparer le comité",
                    sub: "Interne · 12 févr.",
                    status: "À venir",
                    tone: "bg-sky-50 text-sky-800 border-sky-100",
                    Icon: Settings2,
                  },
                ]),
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
            >
              <row.Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{row.title}</p>
                <p className="truncate text-[10px] text-slate-500">{row.sub}</p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold sm:text-[10px]",
                  row.tone,
                )}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Liste réunions proche de l’écran /app/meetings. */
export function MockMeetingsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("bg-white", compact ? "p-3" : "p-4 sm:p-5")}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className={cn("font-semibold text-[#111]", compact ? "text-base" : "text-lg")}>
          Réunions
        </h3>
        <button
          type="button"
          className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-medium text-white shadow-sm"
        >
          + Nouveau compte rendu
        </button>
      </div>

      <div className="mb-3 flex w-max gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5">
        {[
          ["À venir", true],
          ["Analysées (10)", false],
          ["Non analysées", false],
        ].map(([label, active]) => (
          <span
            key={String(label)}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-medium sm:text-xs",
              active ? "bg-[#2563EB] text-white" : "text-slate-600",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Réunion produit</p>
              <p className="text-[10px] text-slate-500">10:00 – 11:00 · Projet Alpha · 3 notes</p>
            </div>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              MAR 17
            </span>
          </div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
            Analysée ✓
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Comité de direction — Avril</p>
              <p className="text-[10px] text-slate-500">14:00 – 15:30 · Interne · 1 note</p>
            </div>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              VEN 13
            </span>
          </div>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            En attente
          </span>
        </div>
      </div>
    </div>
  );
}

export function MockDecisionsSnippet() {
  return (
    <div className="space-y-2 bg-[#F8FAFC] p-4">
      <p className="text-xs font-semibold text-slate-700">Décisions récentes</p>
      {[
        { t: "Valider le budget Q2", st: "Décision prise", ok: true },
        { t: "Reporter la V2 au sprint suivant", st: "En discussion", ok: false },
      ].map((d, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <CheckSquare2
              className={cn("mt-0.5 h-4 w-4 flex-shrink-0", d.ok ? "text-emerald-600" : "text-slate-300")}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{d.t}</p>
              <p className="text-[10px] text-slate-500">{d.st}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MockKanbanSnippet() {
  const cols = [
    { name: "À faire", n: 4, dot: "bg-slate-400" },
    { name: "En cours", n: 7, dot: "bg-blue-500" },
    { name: "Terminé", n: 12, dot: "bg-emerald-500" },
  ];
  return (
    <div className="flex gap-2 overflow-hidden bg-[#F8FAFC] p-3">
      {cols.map((c) => (
        <div key={c.name} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-2">
          <div className="mb-2 flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", c.dot)} />
            <span className="text-[10px] font-semibold text-slate-700">{c.name}</span>
            <span className="text-[10px] text-slate-400">({c.n})</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-8 rounded border border-slate-100 bg-slate-50" />
            <div className="h-8 rounded border border-slate-100 bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
