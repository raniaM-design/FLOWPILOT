"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getPerfactiveProjectColors,
  isUrgentAction,
} from "@/lib/calendar/perfactive-colors";

const START_HOUR = 8;
const END_HOUR = 19;
const HOUR_PX = 52;
const DEFAULT_DURATION_MIN = 60;

function coerceDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function atLocalMidnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function localDateKey(d: Date): string {
  const x = atLocalMidnight(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isLikelyDateOnly(d: Date): boolean {
  return (
    d.getHours() === 0 &&
    d.getMinutes() === 0 &&
    d.getSeconds() === 0 &&
    d.getMilliseconds() === 0
  );
}

export type CalendarWeekTimeGridEntry = {
  action: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | string | null;
    overdue: boolean;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
  };
  approximateWeek?: boolean;
  overdueOnToday?: boolean;
};

function sortEntries(a: CalendarWeekTimeGridEntry, b: CalendarWeekTimeGridEntry): number {
  const x = a.action;
  const y = b.action;
  if (a.overdueOnToday && !b.overdueOnToday) return -1;
  if (!a.overdueOnToday && b.overdueOnToday) return 1;
  if (x.overdue && !y.overdue) return -1;
  if (!x.overdue && y.overdue) return 1;
  if (x.status === "BLOCKED" && y.status !== "BLOCKED") return -1;
  if (x.status !== "BLOCKED" && y.status === "BLOCKED") return 1;
  return 0;
}

type PlacedEntry = {
  entry: CalendarWeekTimeGridEntry;
  startMin: number;
  durationMin: number;
  colors: { bg: string; text: string };
};

function buildPlacementsForDay(entries: CalendarWeekTimeGridEntry[]): PlacedEntry[] {
  const sorted = [...entries].sort(sortEntries);
  let lastEnd = START_HOUR * 60;
  const out: PlacedEntry[] = [];

  sorted.forEach((entry, idx) => {
    const a = entry.action;
    const urgent =
      isUrgentAction(!!entry.overdueOnToday, a.status) ||
      (a.overdue && !entry.approximateWeek);

    let startMin: number;
    if (!a.dueDate) {
      startMin = 9 * 60 + idx * 40;
    } else {
      const due = coerceDate(a.dueDate);
      if (isLikelyDateOnly(due)) {
        startMin = 9 * 60 + idx * 40;
      } else {
        startMin = due.getHours() * 60 + due.getMinutes();
      }
    }

    const minStart = START_HOUR * 60;
    const maxStart = END_HOUR * 60 - 30;
    startMin = Math.max(minStart, Math.min(startMin, maxStart));
    if (startMin < lastEnd) startMin = lastEnd + 5;
    lastEnd = startMin + DEFAULT_DURATION_MIN;

    const done = a.status === "DONE";
    const colors = done
      ? { bg: "#F1F5F9", text: "#64748B" }
      : getPerfactiveProjectColors(a.project.name, { urgent });

    out.push({
      entry,
      startMin,
      durationMin: DEFAULT_DURATION_MIN,
      colors,
    });
  });

  return out;
}

type CalendarWeekTimeGridProps = {
  weekDays: Date[];
  getEntriesForDate: (d: Date) => CalendarWeekTimeGridEntry[];
  onSelectDay: (d: Date) => void;
  weekdayLabels: string[];
};

export function CalendarWeekTimeGrid({
  weekDays,
  getEntriesForDate,
  onSelectDay,
  weekdayLabels,
}: CalendarWeekTimeGridProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_PX;
  const todayKey = localDateKey(now);

  const nowLineTop = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes();
    const start = START_HOUR * 60;
    const end = END_HOUR * 60;
    if (mins < start || mins > end) return null;
    return ((mins - start) / 60) * HOUR_PX;
  }, [now]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex min-h-[420px] flex-1 overflow-x-auto">
        {/* Axe heures */}
        <div
          className="sticky left-0 z-10 w-11 flex-shrink-0 border-r border-slate-100 bg-white pt-[52px]"
          aria-hidden
        >
          {hours.map((h) => (
            <div
              key={h}
              className="box-border flex items-start justify-end pr-1 text-[10px] leading-none text-slate-500"
              style={{
                height: HOUR_PX,
                borderBottom: "1px solid #F3F4F8",
              }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1">
          {weekDays.map((day, colIdx) => {
            const key = localDateKey(day);
            const isTodayCol = key === todayKey;
            const dayNum = day.getDate();
            const label = weekdayLabels[colIdx] ?? weekdayLabels[day.getDay() === 0 ? 6 : day.getDay() - 1] ?? "";

            const placements = buildPlacementsForDay(getEntriesForDate(day));

            return (
              <div
                key={key}
                className="relative min-w-[92px] flex-1 border-l border-slate-100 first:border-l-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`flex h-[52px] w-full flex-col items-center justify-center gap-0.5 border-b border-slate-200 text-center transition-colors hover:bg-slate-50 ${
                    isTodayCol ? "bg-[#FAFBFD]" : "bg-white"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {label}
                  </span>
                  {isTodayCol ? (
                    <span
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: "#2D5BE3" }}
                    >
                      {dayNum}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">
                      {dayNum}
                    </span>
                  )}
                </button>

                <div
                  className={`relative ${isTodayCol ? "bg-[#FAFBFD]" : ""}`}
                  style={{ height: totalHeight }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute left-0 right-0 box-border"
                      style={{
                        top: (h - START_HOUR) * HOUR_PX,
                        height: HOUR_PX,
                        borderBottom: "1px solid #F3F4F8",
                      }}
                    />
                  ))}

                  {isTodayCol && nowLineTop != null && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20"
                      style={{ top: nowLineTop }}
                    >
                      <div
                        className="h-px w-full"
                        style={{ backgroundColor: "#2D5BE3" }}
                      />
                    </div>
                  )}

                  {placements.map(({ entry, startMin, durationMin, colors }) => {
                    const a = entry.action;
                    const top =
                      ((startMin - START_HOUR * 60) / 60) * HOUR_PX;
                    const height = (durationMin / 60) * HOUR_PX;
                    const startH = Math.floor(startMin / 60);
                    const startM = startMin % 60;
                    const endMin = startMin + durationMin;
                    const endH = Math.floor(endMin / 60);
                    const endM = endMin % 60;
                    const timeStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")} – ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                    return (
                      <Link
                        key={`${a.id}-${entry.approximateWeek ? "w" : "d"}${entry.overdueOnToday ? "t" : ""}`}
                        href={
                          a.decision
                            ? `/app/decisions/${a.decision.id}`
                            : `/app/projects/${a.project.id}`
                        }
                        className="absolute left-0.5 right-0.5 z-[5] overflow-hidden rounded-[7px] px-[7px] py-[5px] no-underline transition-opacity hover:opacity-95"
                        style={{
                          top,
                          height: Math.max(height - 2, 28),
                          backgroundColor: colors.bg,
                          color: colors.text,
                          boxShadow: "none",
                          border: "none",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p
                          className="line-clamp-2 font-bold leading-tight"
                          style={{
                            fontSize: 11,
                            color: colors.text,
                          }}
                        >
                          {a.title}
                          {entry.approximateWeek ? " ~" : ""}
                        </p>
                        <p
                          className="mt-0.5 line-clamp-1 truncate"
                          style={{
                            fontSize: 10,
                            color: colors.text,
                            opacity: 0.75,
                          }}
                        >
                          {timeStr} · {a.project.name}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
