import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getDueMeta, isOverdue, formatShortDate } from "@/lib/timeUrgency";
import { PrintActionButton } from "@/components/print-action-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getActionStatusLabel } from "@/lib/utils/action-status";
import { LOGO_OFFICIAL_PATH } from "@/lib/logo-config";

export default async function CalendarPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const params = await searchParams;
  const projectIdFilter = params.projectId;
  const statusFilter = params.status;

  // Charger les actions avec dueDate
  const allActions = await prisma.actionItem.findMany({
    where: projectIdFilter
      ? {
          assigneeId: userId,
          dueDate: {
            not: null,
          },
          projectId: projectIdFilter,
          project: {
            ownerId: userId,
          },
          ...(statusFilter === "open"
            ? { status: { not: "DONE" } }
            : statusFilter === "done"
            ? { status: "DONE" }
            : statusFilter === "blocked"
            ? { status: "BLOCKED" }
            : {}),
        }
      : {
          assigneeId: userId,
          dueDate: {
            not: null,
          },
          project: {
            ownerId: userId,
          },
          ...(statusFilter === "open"
            ? { status: { not: "DONE" } }
            : statusFilter === "done"
            ? { status: "DONE" }
            : statusFilter === "blocked"
            ? { status: "BLOCKED" }
            : {}),
        },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Calculer dueMeta et overdue
  const now = new Date();
  type ActionWithMeta = {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    dueMeta: ReturnType<typeof getDueMeta>;
    overdue: boolean;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
  };

  const actionsWithMeta: ActionWithMeta[] = allActions.map((action: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
  }) => {
    const dueMeta = getDueMeta(action.dueDate, now);
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now);
    return {
      ...action,
      dueMeta,
      overdue,
    };
  });

  // Grouper par date
  const actionsByDate = new Map<string, ActionWithMeta[]>();
  actionsWithMeta.forEach((action: ActionWithMeta) => {
    if (!action.dueDate) return;
    const dateStr = new Date(action.dueDate).toISOString().split("T")[0];
    if (!actionsByDate.has(dateStr)) {
      actionsByDate.set(dateStr, []);
    }
    actionsByDate.get(dateStr)!.push(action);
  });

  // Trier les dates
  const sortedDates = Array.from(actionsByDate.keys()).sort();

  return (
    <div className="print-container">
      {/* Boutons d'action (cachés à l'impression) */}
      <div className="print-actions flex items-center gap-2 mb-4">
        <Link href="/app/calendar">
          <Button variant="outline" size="sm" className="print-hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <PrintActionButton href="/app/calendar/print" />
      </div>

      {/* Contenu print */}
      <div className="print-content">
        <header className="print-header">
          {/* Logo PILOTYS - Fichier officiel unique, identique partout */}
          <div className="print-logo-container">
            <img 
              src={LOGO_OFFICIAL_PATH}
              alt="PILOTYS" 
              className="print-logo-img"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1 className="print-title">Calendrier Deadlines</h1>
          <p className="print-subtitle">
            Vue calendaire des échéances des actions
          </p>
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
            {sortedDates.length === 0 ? (
              <div className="print-empty">
                <p>Aucune action avec échéance pour le moment.</p>
              </div>
            ) : (
              <div className="print-calendar-list">
                {sortedDates.map((dateStr) => {
                  const date = new Date(dateStr);
                  const dayActions = actionsByDate.get(dateStr)!;

                  return (
                    <div key={dateStr} className="print-calendar-day">
                      <h2 className="print-calendar-day-title">
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h2>
                      <div className="print-calendar-actions">
                        {dayActions.map((action: ActionWithMeta) => (
                          <div key={action.id} className="print-calendar-action">
                            <div className="print-calendar-action-header">
                              <h3 className="print-calendar-action-title">{action.title}</h3>
                              <div className="print-calendar-action-badges">
                                <span className="print-badge">{getActionStatusLabel(action.status)}</span>
                                {action.overdue && (
                                  <span className="print-badge print-badge-alert">En retard</span>
                                )}
                              </div>
                            </div>
                            <div className="print-calendar-action-meta">
                              <span>{action.project.name}</span>
                              {action.decision && (
                                <>
                                  <span>•</span>
                                  <span>{action.decision.title}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatShortDate(action.dueDate!)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

