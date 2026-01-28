import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertCircle, Ban } from "lucide-react";
import { calculateDecisionRisk, DecisionRisk } from "@/lib/decision-risk";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";

interface DecisionSummaryProps {
  status: string;
  actions: Array<{
    id: string;
    status: string;
    dueDate: Date | null;
  }>;
}

export function DecisionSummary({ status, actions }: DecisionSummaryProps) {
  // Calculer le risque
  const risk = calculateDecisionRisk(actions);

  // Helper pour le statut
  const getDecisionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary" as const;
      case "DECIDED":
        return "default" as const;
      case "ARCHIVED":
        return "outline" as const;
      default:
        return "outline" as const;
    }
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

  // Calculer si exécutable : au moins 1 action ET toutes les actions ont dueDate
  const isExecutable = actions.length > 0 && actions.every((action) => action.dueDate !== null);

  // Compteurs
  const totalActions = actions.length;
  const doneActions = actions.filter((action) => action.status === "DONE").length;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueActions = actions.filter((action) => {
    if (!action.dueDate || action.status === "DONE") {
      return false;
    }
    const dueDate = new Date(action.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }).length;

  const blockedActions = actions.filter((action) => action.status === "BLOCKED").length;

  // Prochaine échéance : date la plus proche parmi les actions non DONE avec dueDate
  const upcomingActions = actions
    .filter((action) => action.status !== "DONE" && action.dueDate !== null)
    .map((action) => new Date(action.dueDate!))
    .sort((a, b) => a.getTime() - b.getTime());

  const nextDueDate = upcomingActions.length > 0 ? upcomingActions[0] : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Statut */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Statut</span>
            <Badge variant={getDecisionStatusBadgeVariant(status)} className="w-fit">
              {getDecisionStatusLabel(status)}
            </Badge>
          </div>

          {/* Risk */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Risque</span>
            <DecisionRiskBadge risk={risk} />
          </div>

          {/* Exécutable */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Exécutable</span>
            <Badge variant={isExecutable ? "default" : "outline"} className="w-fit">
              {isExecutable ? "Oui" : "Non"}
            </Badge>
          </div>

          {/* Compteurs */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Actions</span>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">{totalActions}</span>
              {doneActions > 0 && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {doneActions}
                </Badge>
              )}
              {overdueActions > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {overdueActions}
                </Badge>
              )}
              {blockedActions > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Ban className="mr-1 h-3 w-3" />
                  {blockedActions}
                </Badge>
              )}
            </div>
          </div>

          {/* Prochaine échéance */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Prochaine échéance</span>
            {nextDueDate ? (
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{nextDueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Aucune</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

