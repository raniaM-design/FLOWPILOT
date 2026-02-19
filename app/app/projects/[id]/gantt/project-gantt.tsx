"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { FlowCard } from "@/components/ui/flow-card";
import { PageHeader } from "@/components/ui/page-header";
import { PrintButton } from "@/components/print-button";
import { ArrowLeft, GanttChart, GripVertical } from "lucide-react";
import Link from "next/link";
import { formatShortDate } from "@/lib/timeUrgency";
import { getActionStatusLabel } from "@/lib/utils/action-status";
import { GanttExportButtons } from "@/components/gantt/gantt-export-buttons";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateActionDueDate, updateActionStatus } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface GanttAction {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  dueDate: Date | null;
  assigneeName: string | null;
  decisionTitle: string | null;
}

interface ProjectGanttProps {
  projectId: string;
  projectName: string;
  actions: GanttAction[];
}

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekLabel(d: Date): string {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
}

// Palette PILOTYS
const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  TODO: { bar: "bg-slate-500 border-slate-700", text: "text-white font-semibold" },
  DOING: { bar: "bg-blue-600 border-blue-800", text: "text-white font-semibold" },
  DONE: { bar: "bg-green-600 border-green-800", text: "text-white font-semibold" },
  BLOCKED: { bar: "bg-red-600 border-red-800", text: "text-white font-semibold" },
};

function getBarStyles(status: string) {
  return (
    STATUS_COLORS[status] || {
      bar: "bg-slate-500 border-slate-700",
      text: "text-white font-semibold",
    }
  );
}

const GANTT_COLUMN_STORAGE_KEY = "gantt-column-order";
const GANTT_ROW_ORDER_STORAGE_KEY = "gantt-row-order";
const STATUS_DOT_COLORS: Record<string, string> = {
  TODO: "bg-slate-500",
  DOING: "bg-blue-600",
  DONE: "bg-green-600",
  BLOCKED: "bg-red-600",
};
const DEFAULT_COLUMNS = [
  { id: "action", label: "Action", width: 180 },
  { id: "assignee", label: "Responsable", width: 120 },
  { id: "status", label: "Statut", width: 120 },
] as const;

function DraggableBar({
  action,
  left,
  width,
}: {
  action: GanttAction & { start: Date; end: Date };
  left: number;
  width: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    data: { type: "gantt-bar", action },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const { bar, text } = getBarStyles(action.status);

  return (
    <div
      ref={setNodeRef}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: "60px",
        ...style,
      }}
      className={`absolute top-2 bottom-2 rounded-md border-2 px-2 py-1 flex items-center justify-between gap-1 text-xs truncate shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow z-10 ${bar} ${isDragging ? "opacity-95 ring-2 ring-slate-800 ring-offset-2" : ""}`}
      title={`${formatShortDate(action.start)} → ${
        action.dueDate ? formatShortDate(action.end) : "Sans échéance"
      }`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/90" />
      <span className={`flex-1 min-w-0 truncate text-center ${text}`} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
        {action.dueDate ? formatShortDate(action.end) : "En cours"}
      </span>
    </div>
  );
}

function getStoredColumnOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_COLUMNS.map((c) => c.id);
  try {
    const stored = localStorage.getItem(GANTT_COLUMN_STORAGE_KEY);
    if (!stored) return DEFAULT_COLUMNS.map((c) => c.id);
    const parsed = JSON.parse(stored) as string[];
    const valid = DEFAULT_COLUMNS.map((c) => c.id);
    return parsed.filter((id) => valid.includes(id)).concat(valid.filter((id) => !parsed.includes(id)));
  } catch {
    return DEFAULT_COLUMNS.map((c) => c.id);
  }
}

function getStoredRowOrder(projectId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(`${GANTT_ROW_ORDER_STORAGE_KEY}-${projectId}`);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

function setStoredRowOrder(projectId: string, ids: string[]) {
  try {
    localStorage.setItem(`${GANTT_ROW_ORDER_STORAGE_KEY}-${projectId}`, JSON.stringify(ids));
  } catch {}
}

function StatusOptionItem({ value, label }: { value: string; label: string }) {
  const dotClass = STATUS_DOT_COLORS[value] || "bg-slate-500";
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}

function SortableGanttRow({
  action,
  idx,
  columnOrder,
  chartWidth,
  handleStatusChange,
  DEFAULT_COLUMNS,
}: {
  action: GanttAction & { start: Date; end: Date; left: number; width: number };
  idx: number;
  columnOrder: string[];
  chartWidth: number;
  handleStatusChange: (actionId: string, newStatus: string) => void;
  DEFAULT_COLUMNS: readonly { id: string; label: string; width: number }[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `row-${action.id}`,
    data: { type: "row", action },
  });
  const style = transform
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex border-b border-slate-200 last:border-b-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${isDragging ? "opacity-60 z-10" : ""}`}
    >
      <div
        className="w-10 flex-shrink-0 flex items-center justify-center gap-0.5 border-r border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50/50 cursor-grab active:cursor-grabbing"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        {idx + 1}
      </div>
      {columnOrder.map((colId) => {
        const col = DEFAULT_COLUMNS.find((c) => c.id === colId);
        if (!col) return null;
        return (
          <div
            key={col.id}
            className="flex-shrink-0 p-2 border-r border-slate-200 flex flex-col justify-center min-h-[56px] bg-white"
            style={{ width: col.width }}
          >
            {col.id === "action" && (
              <div className="text-sm font-semibold text-slate-900 truncate" title={action.title}>
                {action.title}
              </div>
            )}
            {col.id === "assignee" && (
              <div className="text-xs text-slate-600 truncate">{action.assigneeName || "—"}</div>
            )}
            {col.id === "status" && (
              <Select value={action.status} onValueChange={(v) => handleStatusChange(action.id, v)}>
                <SelectTrigger className="h-7 text-xs w-full min-w-0 border-slate-200 bg-white">
                  <SelectValue>
                    {action.status ? (
                      <StatusOptionItem
                        value={action.status}
                        label={getActionStatusLabel(action.status)}
                      />
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">
                    <StatusOptionItem value="TODO" label="À faire" />
                  </SelectItem>
                  <SelectItem value="DOING">
                    <StatusOptionItem value="DOING" label="En cours" />
                  </SelectItem>
                  <SelectItem value="DONE">
                    <StatusOptionItem value="DONE" label="Terminée" />
                  </SelectItem>
                  <SelectItem value="BLOCKED">
                    <StatusOptionItem value="BLOCKED" label="Bloquée" />
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
      <div
        className="flex-1 relative h-14 min-h-[56px] border-l border-slate-200"
        style={{ minWidth: `${chartWidth}px` }}
      >
        <DraggableBar action={action} left={action.left} width={action.width} />
      </div>
    </div>
  );
}

function DraggableColumnHeader({
  id,
  label,
  width,
  isDragging,
}: {
  id: string;
  label: string;
  width: number;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `col-${id}`,
    data: { type: "column", columnId: id },
  });
  const style = transform
    ? { transform: CSS.Transform.toString(transform), transition, width }
    : { width };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 px-2 py-1.5 border-r border-blue-200/60 bg-blue-100/50 cursor-grab active:cursor-grabbing select-none flex-shrink-0 ${
        isDragging ? "opacity-50 ring-1 ring-blue-400" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      <span className="text-xs font-semibold text-slate-800 truncate">{label}</span>
    </div>
  );
}

export function ProjectGantt({ projectId, projectName, actions }: ProjectGanttProps) {
  const router = useRouter();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [optimisticActions, setOptimisticActions] = useState<GanttAction[]>(() => {
    const order = getStoredRowOrder(projectId);
    if (order.length === 0) return actions;
    const byId = new Map(actions.map((a) => [a.id, a]));
    const ordered: GanttAction[] = [];
    for (const id of order) {
      if (byId.has(id)) ordered.push(byId.get(id)!);
    }
    for (const a of actions) {
      if (!order.includes(a.id)) ordered.push(a);
    }
    return ordered;
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [rowDragId, setRowDragId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => getStoredColumnOrder());
  const [columnDragId, setColumnDragId] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticActions((prev) => {
      const order = prev.map((a) => a.id);
      const byId = new Map(actions.map((a) => [a.id, a]));
      const merged = order
        .map((id) => byId.get(id))
        .filter((a): a is GanttAction => Boolean(a));
      for (const a of actions) {
        if (!order.includes(a.id)) merged.push(a);
      }
      return merged;
    });
  }, [actions]);

  const { weeks, minDate, maxDate, chartWidth, totalMs } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allStarts = optimisticActions.map((a) => new Date(a.createdAt));
    const allEnds = optimisticActions
      .filter((a) => a.dueDate)
      .map((a) => new Date(a.dueDate!));
    const noDueEnd = new Date(now);
    noDueEnd.setDate(noDueEnd.getDate() + 14);
    allEnds.push(noDueEnd);

    const minD =
      allStarts.length > 0 ? new Date(Math.min(...allStarts.map((d) => d.getTime()))) : now;
    const maxD =
      allEnds.length > 0 ? new Date(Math.max(...allEnds.map((d) => d.getTime()))) : now;

    minD.setHours(0, 0, 0, 0);
    maxD.setHours(0, 0, 0, 0);

    const minWeek = getStartOfWeek(minD);
    const maxWeek = getStartOfWeek(maxD);
    maxWeek.setDate(maxWeek.getDate() + 7);

    const wks: Date[] = [];
    const cursor = new Date(minWeek);
    while (cursor <= maxWeek) {
      wks.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }

    const totalDays = Math.ceil((maxWeek.getTime() - minWeek.getTime()) / (24 * 60 * 60 * 1000));
    const cw = Math.max(800, Math.min(1400, totalDays * 24));
    const ms = maxWeek.getTime() - minWeek.getTime();

    return { weeks: wks, minDate: minWeek, maxDate: maxWeek, chartWidth: cw, totalMs: ms };
  }, [optimisticActions]);

  const getLeftPercent = (d: Date) => {
    const ms = new Date(d).getTime() - minDate.getTime();
    return Math.max(0, (ms / totalMs) * 100);
  };
  const getWidthPercent = (start: Date, end: Date) => {
    const spanMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
    return Math.max(2, (spanMs / totalMs) * 100);
  };

  const actionsWithDates = optimisticActions.map((a) => {
    const start = new Date(a.createdAt);
    const end = a.dueDate ? new Date(a.dueDate) : new Date();
    if (!a.dueDate) {
      end.setDate(end.getDate() + 7);
    }
    const left = getLeftPercent(start);
    const width = getWidthPercent(start, end);
    return { ...a, start, end, left, width };
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    setRowDragId(null);
    setColumnDragId(null);

    const activeId = String(active.id);

    if (activeId.startsWith("row-")) {
      if (!over) return;
      const overId = String(over.id);
      if (!overId.startsWith("row-")) return;
      const actionIds = optimisticActions.map((a) => a.id);
      const oldIndex = actionIds.indexOf(activeId.replace("row-", ""));
      const newIndex = actionIds.indexOf(overId.replace("row-", ""));
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const next = arrayMove(optimisticActions, oldIndex, newIndex);
        setOptimisticActions(next);
        setStoredRowOrder(projectId, next.map((a) => a.id));
      }
      return;
    }

    if (activeId.startsWith("col-")) {
      if (!over) return;
      const overId = String(over.id);
      if (!overId.startsWith("col-")) return;
      const oldIndex = columnOrder.indexOf(activeId.replace("col-", ""));
      const newIndex = columnOrder.indexOf(overId.replace("col-", ""));
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const next = arrayMove(columnOrder, oldIndex, newIndex);
        setColumnOrder(next);
        try {
          localStorage.setItem(GANTT_COLUMN_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return;
    }

    if (!over || over.id !== "gantt-timeline") return;

    const actionId = active.id as string;
    const action = actionsWithDates.find((a) => a.id === active.id);
    if (!action) return;

    const rect = active.rect.current.translated;
    if (!rect) return;

    const chartEl = timelineRef.current;
    if (!chartEl) return;

    const chartRect = chartEl.getBoundingClientRect();
    const LABEL_WIDTH = 40 + columnOrder.reduce((acc, id) => {
      const col = DEFAULT_COLUMNS.find((c) => c.id === id);
      return acc + (col?.width ?? 120);
    }, 0);
    const timelineLeft = chartRect.left + LABEL_WIDTH;
    const timelineWidth = chartRect.width - LABEL_WIDTH;
    const barCenterX = rect.left + rect.width / 2;
    const relativeX = barCenterX - timelineLeft;
    const percent = Math.max(0, Math.min(1, relativeX / timelineWidth));
    const newDateMs = minDate.getTime() + percent * totalMs;
    const newDueDate = new Date(newDateMs);

    if (newDueDate.getTime() === (action.dueDate ? new Date(action.dueDate).getTime() : 0)) {
      return;
    }

    setOptimisticActions((prev) =>
      prev.map((a) =>
        a.id === actionId ? { ...a, dueDate: newDueDate } : a
      )
    );

    try {
      await updateActionDueDate(actionId, newDueDate.toISOString());
      toast.success("Échéance mise à jour", {
        description: "La modification est synchronisée partout.",
      });
      router.refresh();
    } catch (err) {
      setOptimisticActions(actions);
      toast.error("Erreur", {
        description: "Impossible de mettre à jour l'échéance.",
      });
    }
  };

  const handleStatusChange = async (actionId: string, newStatus: string) => {
    const valid = ["TODO", "DOING", "DONE", "BLOCKED"];
    if (!valid.includes(newStatus)) return;

    setOptimisticActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a))
    );

    try {
      await updateActionStatus(actionId, newStatus as "TODO" | "DOING" | "DONE" | "BLOCKED");
      toast.success("Statut mis à jour", {
        description: "La modification est synchronisée sur le Kanban, les actions, etc.",
      });
      router.refresh();
    } catch (err) {
      setOptimisticActions(actions);
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  const { setNodeRef: setTimelineRef } = useDroppable({
    id: "gantt-timeline",
    data: { type: "timeline" },
  });

  const combinedTimelineRef = (el: HTMLDivElement | null) => {
    (timelineRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    setTimelineRef(el);
  };

  return (
    <div className="relative left-1/2 -ml-[50vw] w-screen min-h-[calc(100vh-3.5rem)] bg-white">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Diagramme de Gantt"
            subtitle={`Planning des actions du projet ${projectName} • Glissez les barres pour modifier les dates, cliquez sur le statut pour le changer`}
            actions={[
              {
                label: "Retour au projet",
                href: `/app/projects/${projectId}`,
                variant: "outline",
                icon: <ArrowLeft className="h-4 w-4" />,
              },
              ...(actions.length > 0
                ? [{ component: <GanttExportButtons projectName={projectName} /> }]
                : []),
              {
                component: (
                  <PrintButton href={`/app/projects/${projectId}/gantt/print`} label="Imprimer / PDF" />
                ),
              },
            ]}
          />

          {optimisticActions.length > 0 && (
            <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
              <div id="gantt-export-canvas">
                <GanttExportCanvas
                  projectName={projectName}
                  actions={actionsWithDates}
                  weeks={weeks}
                  getBarStyles={getBarStyles}
                />
              </div>
            </div>
          )}

          <FlowCard className="bg-white border-blue-200/60 shadow-sm overflow-x-auto w-full">
            {optimisticActions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-slate-400 mb-4">
                    <GanttChart className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune action à afficher</h3>
                  <p className="text-sm text-slate-600">
                    Ajoutez des actions avec des échéances pour voir le diagramme de Gantt.
                  </p>
                  <Link
                    href={`/app/actions/new?projectId=${projectId}`}
                    className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Créer une action →
                  </Link>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={(e) => {
                  const id = String(e.active.id);
                  if (id.startsWith("col-")) setColumnDragId(id);
                  else if (id.startsWith("row-")) setRowDragId(id);
                  else setDraggingId(id);
                }}
                onDragEnd={handleDragEnd}
              >
                <div
                  ref={combinedTimelineRef}
                  className="min-w-[900px]"
                  style={{
                    minWidth: `${
                      chartWidth +
                      40 +
                      columnOrder.reduce((acc, id) => {
                        const col = DEFAULT_COLUMNS.find((c) => c.id === id);
                        return acc + (col?.width ?? 120);
                      }, 0)
                    }px`,
                  }}
                >
                  <div className="sticky top-0 z-20 border-b-2 border-blue-200 bg-blue-50/80">
                    <div className="flex">
                      <div className="w-10 flex-shrink-0 flex items-center justify-center border-r-2 border-blue-200 bg-blue-100/50 py-2">
                        <span className="text-xs font-bold text-slate-600">#</span>
                      </div>
                      <SortableContext
                        items={columnOrder.map((id) => `col-${id}`)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {columnOrder.map((colId) => {
                          const col = DEFAULT_COLUMNS.find((c) => c.id === colId);
                          if (!col) return null;
                          return (
                            <DraggableColumnHeader
                              key={col.id}
                              id={col.id}
                              label={col.label}
                              width={col.width}
                              isDragging={columnDragId === `col-${col.id}`}
                            />
                          );
                        })}
                      </SortableContext>
                      <div
                        className="flex-1 overflow-hidden border-l border-slate-200 min-w-0"
                        style={{ minWidth: `${chartWidth}px` }}
                      >
                        <div className="flex border-l border-slate-200">
                          {weeks.map((w) => (
                            <div
                              key={w.getTime()}
                              className="flex-1 p-2 border-r border-blue-200/60 text-center min-w-[80px] bg-blue-50/60"
                            >
                              <div className="text-xs font-bold text-slate-900">
                                S{(w.getTime() - minDate.getTime()) / (7 * 24 * 60 * 60 * 1000) + 1}
                              </div>
                              <div className="text-[11px] font-medium text-slate-700">{getWeekLabel(w)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <SortableContext
                    items={actionsWithDates.map((a) => `row-${a.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {actionsWithDates.map((action, idx) => (
                      <SortableGanttRow
                        key={action.id}
                        action={action}
                        idx={idx}
                        columnOrder={columnOrder}
                        chartWidth={chartWidth}
                        handleStatusChange={handleStatusChange}
                        DEFAULT_COLUMNS={DEFAULT_COLUMNS}
                      />
                    ))}
                  </SortableContext>
                </div>

                <DragOverlay>
                  {rowDragId ? (() => {
                    const a = actionsWithDates.find((x) => `row-${x.id}` === rowDragId);
                    if (!a) return null;
                    return (
                      <div className="flex border border-slate-300 rounded-lg shadow-xl bg-white overflow-hidden">
                        <div className="w-10 flex-shrink-0 flex items-center justify-center gap-0.5 border-r border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-shrink-0 p-2 min-w-[180px] max-w-[200px] flex flex-col justify-center border-r border-slate-200">
                          <div className="text-sm font-semibold text-slate-900 truncate">{a.title}</div>
                        </div>
                        <div className="flex-shrink-0 p-2 min-w-[80px] flex flex-col justify-center border-r border-slate-200 text-xs text-slate-600">
                          {a.assigneeName || "—"}
                        </div>
                        <div className="flex-shrink-0 p-2 min-w-[100px] flex items-center">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_DOT_COLORS[a.status] || "bg-slate-500"} text-white`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            {getActionStatusLabel(a.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })() : draggingId ? (
                    (() => {
                      const a = actionsWithDates.find((x) => x.id === draggingId);
                      if (!a) return null;
                      const { bar, text } = getBarStyles(a.status);
                      return (
                        <div
                          className={`rounded-md border-2 px-2 py-1 flex items-center gap-1 text-xs shadow-xl cursor-grabbing ${bar} ${text}`}
                          style={{
                            width: `${Math.max(60, a.width * chartWidth / 100)}px`,
                            minWidth: "80px",
                            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          }}
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/90" />
                          {a.dueDate ? formatShortDate(a.end) : "En cours"}
                        </div>
                      );
                    })()
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </FlowCard>

          {optimisticActions.length > 0 && (
            <FlowCard className="bg-white border-blue-200/60 shadow-sm">
              <div className="p-4">
                <div className="text-sm font-semibold text-slate-900 mb-3">Légende</div>
                <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 rounded-md bg-slate-500 border-2 border-slate-700 shadow-sm" />
                    <span className="text-sm font-medium text-slate-900">À faire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 rounded-md bg-blue-600 border-2 border-blue-800 shadow-sm" />
                    <span className="text-sm font-medium text-slate-900">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 rounded-md bg-green-600 border-2 border-green-800 shadow-sm" />
                    <span className="text-sm font-medium text-slate-900">Terminée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 rounded-md bg-red-600 border-2 border-red-800 shadow-sm" />
                    <span className="text-sm font-medium text-slate-900">Bloquée</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Glissez la poignée (⋮⋮) à gauche du numéro pour réordonner les actions. Glissez les en-têtes de colonnes pour les réorganiser. Glissez une barre pour modifier l&apos;échéance.
                </p>
              </div>
            </FlowCard>
          )}
        </div>
      </div>
    </div>
  );
}

function GanttExportCanvas({
  projectName,
  actions,
  weeks,
  getBarStyles,
}: {
  projectName: string;
  actions: Array<GanttAction & { start: Date; end: Date; left: number; width: number }>;
  weeks: Date[];
  getBarStyles: (s: string) => { bar: string; text: string };
}) {
  return (
    <div className="bg-white p-8" style={{ width: "1200px" }}>
      <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-slate-300">
        <img src="/branding/logo-full.png" alt="PILOTYS" className="h-10 object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagramme de Gantt</h1>
          <p className="text-sm font-medium text-slate-700">{projectName}</p>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            Généré le{" "}
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-blue-50 border-b-2 border-blue-200 p-2 flex">
          <div className="w-8 flex-shrink-0 text-center text-xs font-bold text-slate-600">#</div>
          <div className="w-[180px] flex-shrink-0 text-xs font-bold text-slate-900 uppercase">
            Action
          </div>
          <div className="flex-1 flex">
            {weeks.slice(0, 12).map((w, i) => (
              <div
                key={w.getTime()}
                className="flex-1 text-center text-[11px] font-semibold text-slate-800 min-w-[60px]"
              >
                S{i + 1}
              </div>
            ))}
          </div>
        </div>
        {actions.slice(0, 15).map((action, idx) => {
          const { bar, text } = getBarStyles(action.status);
          return (
            <div
              key={action.id}
              className={`flex border-b border-slate-200 last:border-b-0 ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <div className="w-8 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-600 border-r border-slate-200">
                {idx + 1}
              </div>
              <div className="w-[180px] p-2 flex-shrink-0 border-r border-slate-200">
                <div className="text-xs font-semibold text-slate-900 truncate">{action.title}</div>
                <div className="text-[11px] font-medium text-slate-700">{getActionStatusLabel(action.status)}</div>
              </div>
              <div className="flex-1 relative h-10 min-h-[40px]">
                <div
                  className={`absolute top-1 bottom-1 rounded-md border-2 px-1.5 py-0.5 flex items-center justify-center text-[11px] truncate ${bar} ${text}`}
                  style={{
                    left: `${action.left}%`,
                    width: `${action.width}%`,
                    minWidth: "40px",
                    textShadow: "0 1px 1px rgba(0,0,0,0.2)",
                  }}
                >
                  {action.dueDate ? formatShortDate(action.end) : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-6 mt-4 pt-4 border-t-2 border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-slate-500 border-2 border-slate-700" />
          <span className="text-sm font-semibold text-slate-900">À faire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-blue-600 border-2 border-blue-800" />
          <span className="text-sm font-semibold text-slate-900">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-green-600 border-2 border-green-800" />
          <span className="text-sm font-semibold text-slate-900">Terminée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-red-600 border-2 border-red-800" />
          <span className="text-sm font-semibold text-slate-900">Bloquée</span>
        </div>
      </div>
    </div>
  );
}
