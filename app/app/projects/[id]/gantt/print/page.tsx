import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { notFound } from "next/navigation";
import { canAccessProject } from "@/lib/company/getCompanyProjects";
import { PrintActionButton } from "@/components/print-action-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatShortDate } from "@/lib/timeUrgency";
import { getActionStatusLabel } from "@/lib/utils/action-status";

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

export default async function ProjectGanttPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();
  const { id } = await params;

  const hasAccess = await canAccessProject(userId, id);
  if (!hasAccess) notFound();

  const project = await prisma.project.findFirst({
    where: { id },
    include: {
      actions: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        include: {
          assignee: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allStarts = project.actions.map((a) => new Date(a.createdAt));
  const allEnds = project.actions
    .filter((a) => a.dueDate)
    .map((a) => new Date(a.dueDate!));
  const noDueEnd = new Date(now);
  noDueEnd.setDate(noDueEnd.getDate() + 14);
  allEnds.push(noDueEnd);

  const minDate = allStarts.length > 0
    ? getStartOfWeek(new Date(Math.min(...allStarts.map((d) => d.getTime()))))
    : getStartOfWeek(now);
  const maxDate = allEnds.length > 0
    ? new Date(Math.max(...allEnds.map((d) => d.getTime())))
    : now;
  const maxWeek = getStartOfWeek(maxDate);
  maxWeek.setDate(maxWeek.getDate() + 7);

  const weeks: Date[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxWeek) {
    weeks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  const totalMs = maxWeek.getTime() - minDate.getTime();
  const getLeftPercent = (d: Date) => {
    const ms = new Date(d).getTime() - minDate.getTime();
    return Math.max(0, (ms / totalMs) * 100);
  };
  const getWidthPercent = (start: Date, end: Date) => {
    const spanMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
    return Math.max(2, (spanMs / totalMs) * 100);
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-600 border-green-800 text-white font-semibold";
      case "DOING":
        return "bg-blue-600 border-blue-800 text-white font-semibold";
      case "BLOCKED":
        return "bg-red-600 border-red-800 text-white font-semibold";
      case "TODO":
      default:
        return "bg-slate-500 border-slate-700 text-white font-semibold";
    }
  };

  const actionsWithDates = project.actions.map((a) => {
    const start = new Date(a.createdAt);
    const end = a.dueDate ? new Date(a.dueDate) : new Date();
    if (!a.dueDate) end.setDate(end.getDate() + 7);
    return {
      ...a,
      start,
      end,
      left: getLeftPercent(start),
      width: getWidthPercent(start, end),
      assigneeName: a.assignee?.name ?? a.assignee?.email ?? null,
    };
  });

  return (
    <div className="print-container">
      <div className="print-actions flex items-center gap-2 mb-4">
        <Link href={`/app/projects/${project.id}/gantt`}>
          <Button variant="outline" size="sm" className="print-hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <PrintActionButton href={`/app/projects/${project.id}/gantt/print`} label="Exporter PDF" />
      </div>

      <div className="print-content">
        <header className="print-header">
          <div className="print-logo-container">
            <img
              src="/branding/logo-full.png"
              alt="PILOTYS"
              className="print-logo-img"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1 className="print-title">Diagramme de Gantt — {project.name}</h1>
          <p className="print-subtitle">Planning des actions du projet</p>
          <p className="print-date">
            Généré le {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </header>

        <div className="print-body">
          {actionsWithDates.length === 0 ? (
            <div className="print-empty">
              <p>Aucune action dans ce projet pour le moment.</p>
            </div>
          ) : (
            <div className="print-gantt">
              <div className="print-gantt-header flex border-b-2 border-slate-300 bg-slate-50">
                <div className="w-8 flex-shrink-0 flex items-center justify-center border-r-2 border-slate-300 font-bold text-xs text-slate-600">
                  #
                </div>
                <div className="w-[200px] flex-shrink-0 p-3 border-r-2 border-slate-300 font-semibold text-xs text-slate-600 uppercase">
                  Action
                </div>
                <div className="flex-1 flex overflow-hidden">
                  {weeks.map((w, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[50px] p-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200"
                    >
                      S{i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {actionsWithDates.map((action, idx) => (
                <div
                  key={action.id}
                  className={`flex border-b border-slate-200 min-h-[48px] ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <div className="w-8 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-600 border-r-2 border-slate-200 bg-slate-50/50">
                    {idx + 1}
                  </div>
                  <div className="w-[200px] flex-shrink-0 p-3 border-r-2 border-slate-200 bg-white">
                    <div className="text-sm font-semibold text-slate-900">{action.title}</div>
                    <div className="text-xs font-medium text-slate-700 mt-0.5">
                      {action.assigneeName && <span>{action.assigneeName}</span>}
                      {action.assigneeName && " • "}
                      <span>{getActionStatusLabel(action.status)}</span>
                    </div>
                  </div>
                  <div className="flex-1 relative min-h-[44px] py-2">
                    <div
                      className={`absolute top-2 bottom-2 rounded-md border-2 px-2 py-1 flex items-center justify-center text-xs ${getBarColor(
                        action.status
                      )}`}
                      style={{
                        left: `${action.left}%`,
                        width: `${action.width}%`,
                        minWidth: "48px",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      {action.dueDate ? formatShortDate(action.end) : "En cours"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {actionsWithDates.length > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-slate-200 flex flex-wrap gap-6">
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
          )}
        </div>
      </div>
    </div>
  );
}
