/**
 * Types pour l'export de la Monthly Review
 * Source de vérité unique pour les données d'export
 */

export type MonthlyReviewExportData = {
  period: {
    year: number;
    month: number;
    label: string; // "Janvier 2025" ou "January 2025"
  };
  summary: string; // Résumé exécutif généré
  kpis: {
    meetings: number;
    actionsTotal: number;
    actionsDone: number;
    actionsOverdue: number;
    decisions: number;
    completionRate: number; // Pourcentage de complétion
  };
  charts: {
    activityByWeek: Array<{
      weekLabel: string;
      meetings: number;
      actions: number;
      decisions: number;
    }>;
    actionStatus: Array<{
      status: "done" | "in_progress" | "blocked" | "overdue" | "todo";
      label: string; // Traduit selon locale
      value: number;
      percentage: number;
    }>;
    projectProgress: Array<{
      projectId: string;
      name: string;
      completionRate: number;
      done: number;
      total: number;
      overdue: number;
      status: "on_track" | "at_risk" | "blocked";
    }>;
  };
  highlights: {
    keyDecisions: Array<{
      id: string;
      title: string;
      date: string; // Formaté selon locale
      projectName?: string;
      status: string; // "DECIDED" | "DRAFT"
    }>;
    nextMonthFocus: Array<{
      id: string;
      title: string;
      dueDate?: string; // Formaté selon locale
      owner?: string;
      projectName?: string;
      status: string;
    }>;
  };
};

