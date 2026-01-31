"use client";

import { useState } from "react";
import { showActionCreatedToast } from "@/lib/toast-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, AlertCircle, ListTodo, CheckSquare } from "lucide-react";
import { createActionItem } from "./actions";
import { useRouter } from "next/navigation";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { DecisionRisk } from "@/lib/decision-risk";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { DecisionUrgencyBar } from "@/components/decision-urgency-bar";
import { ActionFormFields } from "@/components/action-form-fields";
import { InviteCollaborator } from "@/components/collaboration/invite-collaborator";
import { CollaboratorsList } from "@/components/collaboration/collaborators-list";

interface DecisionActionsProps {
  decision: {
    id: string;
    title: string;
    context: string | null;
    decision: string | null;
    status: string;
    createdAt: Date;
    actions: Array<{
      id: string;
      title: string;
      status: string;
      dueDate: Date | null;
      createdAt: Date;
    }>;
  };
  projectId: string;
  risk: DecisionRisk;
}

const getDecisionStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "DECIDED":
      return "default";
    case "ARCHIVED":
      return "outline";
    default:
      return "outline";
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

const isActionOverdue = (dueDate: Date | null, status: string): boolean => {
  if (!dueDate || status === "DONE") {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

export function DecisionActions({ decision, projectId, risk }: DecisionActionsProps) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{decision.title}</CardTitle>
              <Badge variant={getDecisionStatusBadgeVariant(decision.status)}>
                {getDecisionStatusLabel(decision.status)}
              </Badge>
              <DecisionRiskBadge risk={risk} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(decision.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {decision.context && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Contexte</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{decision.context}</p>
              </div>
            )}
            {decision.decision && (
              <>
                {decision.context && <Separator className="my-3" />}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Décision prise</p>
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{decision.decision}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <InviteCollaborator entityType="decision" entityId={decision.id} />
            <CollaboratorsList entityType="decision" entityId={decision.id} />
          </div>
        </div>
        {/* Urgency Bar */}
        <div className="mt-3">
          <DecisionUrgencyBar actions={decision.actions} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Actions</h4>
              {decision.actions.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {decision.actions.length}
                </Badge>
              )}
            </div>
            {!showForm && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Ajouter une action
              </Button>
            )}
          </div>

          {decision.actions.length === 0 && !showForm ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Aucune action pour cette décision
            </div>
          ) : (
            <div className="space-y-2">
              {decision.actions.map((action) => {
                const overdue = isActionOverdue(action.dueDate, action.status);
                return (
                  <div
                    key={action.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                      overdue ? "border-destructive/50 bg-destructive/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <CheckSquare className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{action.title}</p>
                        <Badge variant={getActionStatusBadgeVariant(action.status)} className="text-xs">
                          {getActionStatusLabel(action.status)}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            En retard
                          </Badge>
                          )}
                        </div>
                        {action.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Échéance : {new Date(action.dueDate).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ActionStatusButtons
                      actionId={action.id}
                      currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulaire d'ajout d'action */}
          {showForm && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <form
                action={async (formData) => {
                  await createActionItem(formData);
                  setShowForm(false);
                  showActionCreatedToast("Votre action a été ajoutée à cette décision.");
                  router.refresh();
                }}
                className="space-y-4"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="decisionId" value={decision.id} />
                
                <ActionFormFields decisionId={decision.id} />
                
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Ajouter l'action
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

