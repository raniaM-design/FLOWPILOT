import { isOverdue } from "@/lib/timeUrgency";

interface ActionItem {
  id: string;
  status: string;
  dueDate: Date | null;
}

interface DecisionUrgencyBarProps {
  actions: ActionItem[];
}

/**
 * Calcule les counts pour une décision côté serveur
 */
function calculateActionCounts(actions: ActionItem[]) {
  const now = new Date();
  
  let doneCount = 0;
  let openCount = 0;
  let overdueCount = 0;
  let blockedCount = 0;

  actions.forEach((action) => {
    if (action.status === "DONE") {
      doneCount++;
    } else if (action.status === "BLOCKED") {
      blockedCount++;
    } else {
      // OPEN ou OVERDUE (TODO/DOING)
      const isOverdueAction = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now);
      if (isOverdueAction) {
        overdueCount++;
      } else {
        openCount++;
      }
    }
  });

  return { doneCount, openCount, overdueCount, blockedCount };
}

/**
 * Composant Server Component pour afficher la barre d'urgence d'une décision
 * Affiche 4 segments proportionnels : DONE, OPEN, OVERDUE, BLOCKED
 */
export function DecisionUrgencyBar({ actions }: DecisionUrgencyBarProps) {
  const { doneCount, openCount, overdueCount, blockedCount } = calculateActionCounts(actions);
  const total = actions.length;

  // Si aucune action, ne rien afficher
  if (total === 0) {
    return null;
  }

  // Calculer les pourcentages (minimum 2px pour visibilité)
  const donePercent = total > 0 ? Math.max((doneCount / total) * 100, doneCount > 0 ? 2 : 0) : 0;
  const openPercent = total > 0 ? Math.max((openCount / total) * 100, openCount > 0 ? 2 : 0) : 0;
  const overduePercent = total > 0 ? Math.max((overdueCount / total) * 100, overdueCount > 0 ? 2 : 0) : 0;
  const blockedPercent = total > 0 ? Math.max((blockedCount / total) * 100, blockedCount > 0 ? 2 : 0) : 0;

  // Construire la légende
  const legendParts: string[] = [];
  if (openCount > 0) legendParts.push(`${openCount} open`);
  if (overdueCount > 0) legendParts.push(`${overdueCount} overdue`);
  if (blockedCount > 0) legendParts.push(`${blockedCount} blocked`);

  return (
    <div className="flex items-center gap-2">
      {/* Barre horizontale */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
        {doneCount > 0 && (
          <div
            className="bg-muted-foreground/30"
            style={{ width: `${donePercent}%` }}
            title={`${doneCount} terminée${doneCount > 1 ? "s" : ""}`}
          />
        )}
        {openCount > 0 && (
          <div
            className="bg-blue-500"
            style={{ width: `${openPercent}%` }}
            title={`${openCount} ouverte${openCount > 1 ? "s" : ""}`}
          />
        )}
        {overdueCount > 0 && (
          <div
            className="bg-destructive"
            style={{ width: `${overduePercent}%` }}
            title={`${overdueCount} en retard`}
          />
        )}
        {blockedCount > 0 && (
          <div
            className="bg-orange-500"
            style={{ width: `${blockedPercent}%` }}
            title={`${blockedCount} bloquée${blockedCount > 1 ? "s" : ""}`}
          />
        )}
      </div>
      
      {/* Légende */}
      {legendParts.length > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {legendParts.join(" • ")}
        </span>
      )}
    </div>
  );
}

