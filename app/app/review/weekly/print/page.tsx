import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { isOverdue, formatShortDate } from "@/lib/timeUrgency";
import { PrintActionButton } from "@/components/print-action-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LOGO_OFFICIAL_PATH } from "@/lib/logo-config";

export default async function WeeklyReviewPrintPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Dates pour la semaine
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 1) Décisions à surveiller (risk RED, max 5)
  const allDecisions = await prisma.decision.findMany({
    where: {
      project: {
        ownerId: userId,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const riskyDecisions = allDecisions
    .map((decision) => {
      const risk = calculateDecisionRisk(decision.actions);
      return {
        ...decision,
        risk,
      };
    })
    .filter((decision) => decision.risk.level === "RED")
    .slice(0, 5);

  // 2) Actions bloquées (status BLOCKED, max 10)
  const blockedActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "BLOCKED",
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
      createdAt: "desc",
    },
    take: 10,
  });

  // 3) Actions en retard (overdue, max 10)
  const allActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
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
  });

  const overdueActions = allActions
    .filter((action) => isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now))
    .slice(0, 10);

  // 4) Décisions prises cette semaine (DECIDED, createdAt within last 7 days)
  const recentDecisions = await prisma.decision.findMany({
    where: {
      createdById: userId,
      status: "DECIDED",
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getActionStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "À faire";
      case "DOING":
        return "En cours";
      case "DONE":
        return "Terminée";
      case "BLOCKED":
        return "Bloquée";
      default:
        return status;
    }
  };

  return (
    <div className="print-container">
      {/* Boutons d'action (cachés à l'impression) */}
      <div className="print-actions flex items-center gap-2 mb-4">
        <Link href="/app/review/weekly">
          <Button variant="outline" size="sm" className="print-hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <PrintActionButton href="/app/review/weekly/print" />
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
          <h1 className="print-title">Weekly Review</h1>
          <p className="print-subtitle">
            Ce qui avance, ce qui bloque, ce qui mérite une décision.
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
          {/* Décisions à surveiller */}
          {riskyDecisions.length > 0 && (
              <div className="print-section">
                <h2 className="print-section-title">Décisions à surveiller</h2>
                <div className="print-list">
                  {riskyDecisions.map((decision) => (
                    <div key={decision.id} className="print-item">
                      <div className="print-item-header">
                        <h3 className="print-item-title">{decision.title}</h3>
                        <span className="print-badge print-badge-risk">{decision.risk.label}</span>
                      </div>
                      <div className="print-item-meta">
                        <span>{decision.project.name}</span>
                        <span>•</span>
                        <span>{decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}

          {/* Actions bloquées */}
          {blockedActions.length > 0 && (
              <div className="print-section">
                <h2 className="print-section-title">Actions bloquées</h2>
                <div className="print-list">
                  {blockedActions.map((action) => (
                    <div key={action.id} className="print-item">
                      <div className="print-item-header">
                        <h3 className="print-item-title">{action.title}</h3>
                        <span className="print-badge">{getActionStatusLabel(action.status)}</span>
                      </div>
                      <div className="print-item-meta">
                        <span>{action.project.name}</span>
                        {action.decision && (
                          <>
                            <span>•</span>
                            <span>{action.decision.title}</span>
                          </>
                        )}
                        {action.dueDate && (
                          <>
                            <span>•</span>
                            <span>Échéance: {formatShortDate(action.dueDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}

          {/* Actions en retard */}
          {overdueActions.length > 0 && (
              <div className="print-section">
                <h2 className="print-section-title">Actions en retard</h2>
                <div className="print-list">
                  {overdueActions.map((action) => (
                    <div key={action.id} className="print-item">
                      <div className="print-item-header">
                        <h3 className="print-item-title">{action.title}</h3>
                        <span className="print-badge">{getActionStatusLabel(action.status)}</span>
                      </div>
                      <div className="print-item-meta">
                        <span>{action.project.name}</span>
                        {action.decision && (
                          <>
                            <span>•</span>
                            <span>{action.decision.title}</span>
                          </>
                        )}
                        {action.dueDate && (
                          <>
                            <span>•</span>
                            <span>Échéance: {formatShortDate(action.dueDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}

          {/* Décisions prises cette semaine */}
          {recentDecisions.length > 0 && (
              <div className="print-section">
                <h2 className="print-section-title">Décisions prises cette semaine</h2>
                <div className="print-list">
                  {recentDecisions.map((decision) => {
                    const risk = calculateDecisionRisk(decision.actions);
                    return (
                      <div key={decision.id} className="print-item">
                        <div className="print-item-header">
                          <h3 className="print-item-title">{decision.title}</h3>
                          <span className="print-badge print-badge-risk">{risk.label}</span>
                        </div>
                        <div className="print-item-meta">
                          <span>{decision.project.name}</span>
                          <span>•</span>
                          <span>{decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}</span>
                          <span>•</span>
                          <span>{new Date(decision.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          )}

          {riskyDecisions.length === 0 && blockedActions.length === 0 && overdueActions.length === 0 && recentDecisions.length === 0 && (
            <div className="print-empty">
              <p>Aucun élément à afficher pour cette semaine.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

