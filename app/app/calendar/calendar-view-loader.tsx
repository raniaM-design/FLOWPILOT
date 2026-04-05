"use client";

import dynamic from "next/dynamic";
import type { CalendarViewProps } from "./calendar-view";

const CalendarView = dynamic(
  () => import("./calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[420px] w-full animate-pulse rounded-lg bg-slate-100"
        aria-hidden
      />
    ),
  }
);

export function CalendarViewLoader({
  actions,
  projects,
  initialProjectId,
  initialStatus,
}: CalendarViewProps) {
  return (
    <CalendarView
      actions={actions}
      projects={projects}
      initialProjectId={initialProjectId}
      initialStatus={initialStatus}
    />
  );
}
