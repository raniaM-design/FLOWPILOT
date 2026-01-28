/**
 * Module unifié "Temps & Urgence" (server-only)
 * Helpers pour gérer les dates d'échéance et l'urgence des actions et décisions
 */

export type DueMetaKind = "NONE" | "TODAY" | "TOMORROW" | "SOON" | "THIS_WEEK" | "LATER" | "OVERDUE";

export interface DueMeta {
  label: string;
  kind: DueMetaKind;
  daysDiff?: number;
}

type ActionStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

/**
 * Calcule les métadonnées d'une date d'échéance
 * 
 * @param dueDate - Date d'échéance (peut être null)
 * @param now - Date de référence (par défaut: maintenant)
 * @returns Métadonnées avec label, kind et daysDiff optionnel
 */
export function getDueMeta(dueDate: Date | null, now: Date = new Date()): DueMeta {
  if (!dueDate) {
    return {
      label: "Aucune échéance",
      kind: "NONE",
    };
  }

  // Normaliser les dates (heures à 0)
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Calculer la différence en jours
  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Aujourd'hui
  if (daysDiff === 0) {
    return {
      label: "Aujourd'hui",
      kind: "TODAY",
      daysDiff: 0,
    };
  }

  // Demain
  if (daysDiff === 1) {
    return {
      label: "Demain",
      kind: "TOMORROW",
      daysDiff: 1,
    };
  }

  // En retard
  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff);
    return {
      label: absDays === 1 ? "En retard (1 jour)" : `En retard (${absDays} jours)`,
      kind: "OVERDUE",
      daysDiff,
    };
  }

  // Bientôt (<= 3 jours)
  if (daysDiff <= 3) {
    return {
      label: `Dans ${daysDiff} jour${daysDiff > 1 ? "s" : ""}`,
      kind: "SOON",
      daysDiff,
    };
  }

  // Cette semaine (<= 7 jours)
  if (daysDiff <= 7) {
    return {
      label: `Cette semaine (${daysDiff} jours)`,
      kind: "THIS_WEEK",
      daysDiff,
    };
  }

  // Plus tard (> 7 jours)
  return {
    label: formatShortDate(due),
    kind: "LATER",
    daysDiff,
  };
}

/**
 * Formate une date en format court lisible (FR)
 * Exemples: "23 déc." ou "15 janv. 2024"
 * 
 * @param date - Date à formater
 * @returns Date formatée en français court
 */
export function formatShortDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const months = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
  ];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  // Si l'année est différente de l'année actuelle, l'inclure
  if (year !== today.getFullYear()) {
    return `${day} ${month} ${year}`;
  }

  return `${day} ${month}`;
}

/**
 * Vérifie si une action est en retard
 * 
 * @param dueDate - Date d'échéance (peut être null)
 * @param status - Statut de l'action
 * @param now - Date de référence (par défaut: maintenant)
 * @returns true si l'action est en retard (dueDate passée et status != DONE)
 */
export function isOverdue(
  dueDate: Date | null,
  status: ActionStatus,
  now: Date = new Date()
): boolean {
  // Si pas de dueDate ou action terminée, pas en retard
  if (!dueDate || status === "DONE") {
    return false;
  }

  // Normaliser les dates
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return due < today;
}

