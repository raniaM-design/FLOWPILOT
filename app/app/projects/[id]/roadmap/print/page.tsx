import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { calculateDecisionRisk, DecisionRisk } from "@/lib/decision-risk";
import { formatShortDate } from "@/lib/timeUrgency";
import { PrintActionButton } from "@/components/print-action-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LOGO_OFFICIAL_PATH } from "@/lib/logo-config";

export default async function RoadmapPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Charger le projet avec ses décisions et actions
  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId,
    },
    include: {
      decisions: {
        include: {
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
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Dates pour le groupement
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);
  
  const twoWeeks = new Date(now);
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  twoWeeks.setHours(23, 59, 59, 999);

  // Calculer les métriques pour chaque décision
  type DecisionMetrics = {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    nextDueDate: Date | null;
    totalActions: number;
    openActions: number;
    doneActions: number;
    blockedActions: number;
    overdueCount: number;
    riskLevel: DecisionRisk;
    nextStep: string;
  };

  const decisionsWithMetrics: DecisionMetrics[] = project.decisions.map((decision: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    actions: Array<{
      id: string;
      status: string;
      dueDate: Date | null;
    }>;
  }) => {
    const actions = decision.actions;
    
    const upcomingDueDates = actions
      .filter((action: { id: string; status: string; dueDate: Date | null }) => action.status !== "DONE" && action.dueDate !== null)
      .map((action: { id: string; status: string; dueDate: Date | null }) => new Date(action.dueDate!))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const nextDueDate = upcomingDueDates.length > 0 ? upcomingDueDates[0] : null;

    const totalActions = actions.length;
    const doneActions = actions.filter((action: { id: string; status: string; dueDate: Date | null }) => action.status === "DONE").length;
    const openActions = actions.filter((action: { id: string; status: string; dueDate: Date | null }) => action.status !== "DONE").length;
    const blockedActions = actions.filter((action: { id: string; status: string; dueDate: Date | null }) => action.status === "BLOCKED").length;
    
    const overdueCount = actions.filter((action: { id: string; status: string; dueDate: Date | null }) => {
      if (!action.dueDate || action.status === "DONE") {
        return false;
      }
      const dueDate = new Date(action.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    }).length;

    const riskLevel = calculateDecisionRisk(actions);

    let nextStep = "Continuer l'exécution";
    if (actions.length === 0) {
      nextStep = "Ajouter une action avec échéance";
    } else if (blockedActions > 0) {
      nextStep = "Débloquer l'action bloquée";
    } else if (overdueCount > 0) {
      nextStep = "Replanifier les actions en retard";
    } else if (openActions > 0) {
      nextStep = "Démarrer une action";
    }

    return {
      id: decision.id,
      title: decision.title,
      status: decision.status,
      createdAt: decision.createdAt,
      nextDueDate,
      totalActions,
      openActions,
      doneActions,
      blockedActions,
      overdueCount,
      riskLevel,
      nextStep,
    };
  });

  // Groupement par sections
  const thisWeek = decisionsWithMetrics.filter((d) => {
    if (!d.nextDueDate) return false;
    const dueDate = new Date(d.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= now && dueDate <= nextWeek;
  }).sort((a, b) => {
    if (!a.nextDueDate || !b.nextDueDate) return 0;
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
  });

  const nextWeekDecisions = decisionsWithMetrics.filter((d) => {
    if (!d.nextDueDate) return false;
    const dueDate = new Date(d.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > nextWeek && dueDate <= twoWeeks;
  }).sort((a, b) => {
    if (!a.nextDueDate || !b.nextDueDate) return 0;
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
  });

  const upcoming = decisionsWithMetrics.filter((d) => {
    if (!d.nextDueDate) return false;
    const dueDate = new Date(d.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > twoWeeks;
  }).sort((a, b) => {
    if (!a.nextDueDate || !b.nextDueDate) return 0;
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
  });

  const noDueDate = decisionsWithMetrics.filter((d) => !d.nextDueDate);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(d);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Aujourd'hui";
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Demain";
    }
    return formatShortDate(d);
  };

  const getDecisionStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Brouillon";
      case "DECIDED":
        return "Décidée";
      case "ARCHIVED":
        return "Archivée";
      default:
        return status;
    }
  };

  const renderSection = (title: string, decisions: DecisionMetrics[]) => {
    if (decisions.length === 0) return null;

    return (
      <div className="print-section">
        <h2 className="print-section-title">{title}</h2>
        <div className="print-decisions-list">
          {decisions.map((decision) => (
            <div key={decision.id} className="print-decision-item">
              <div className="print-decision-header">
                <h3 className="print-decision-title">{decision.title}</h3>
                <div className="print-decision-badges">
                  <span className="print-badge">{getDecisionStatusLabel(decision.status)}</span>
                  <span className="print-badge print-badge-risk">{decision.riskLevel.label}</span>
                </div>
              </div>
              <div className="print-decision-meta">
                <div className="print-meta-row">
                  <span className="print-meta-label">Prochaine échéance:</span>
                  <span>{decision.nextDueDate ? formatDate(decision.nextDueDate) : "Aucune"}</span>
                </div>
                <div className="print-meta-row">
                  <span className="print-meta-label">Actions:</span>
                  <span>{decision.totalActions} total • {decision.openActions} ouvertes • {decision.doneActions} terminées</span>
                  {decision.overdueCount > 0 && <span className="print-meta-alert"> • {decision.overdueCount} en retard</span>}
                  {decision.blockedActions > 0 && <span className="print-meta-alert"> • {decision.blockedActions} bloquées</span>}
                </div>
                <div className="print-meta-row">
                  <span className="print-meta-label">Prochaine étape:</span>
                  <span>{decision.nextStep}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="print-container">
      {/* Boutons d'action (cachés à l'impression) */}
      <div className="print-actions flex items-center gap-2 mb-4">
        <Link href={`/app/projects/${project.id}/roadmap`}>
          <Button variant="outline" size="sm" className="print-hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <PrintActionButton />
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
          <h1 className="print-title">Roadmap — {project.name}</h1>
          <p className="print-subtitle">
            Vue chronologique des décisions et de leur exécution
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
            {renderSection("Cette semaine", thisWeek)}
            {renderSection("Semaine prochaine", nextWeekDecisions)}
            {renderSection("À venir", upcoming)}
            {renderSection("Sans échéance", noDueDate)}

            {thisWeek.length === 0 && nextWeekDecisions.length === 0 && upcoming.length === 0 && noDueDate.length === 0 && (
              <div className="print-empty">
                <p>Aucune décision dans ce projet pour le moment.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

