"use client";

import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, User, FileText, AlertCircle, FolderKanban, ArrowRight, ListTodo } from "lucide-react";
import { getActionStatusLabel, getActionStatusBadgeVariant } from "@/lib/utils/action-status";
import Link from "next/link";

type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: {
    id: string;
    email: string;
  } | null;
  decision: {
    id: string;
    title: string;
  } | null;
};

interface MeetingActionsViewProps {
  actions: ActionItem[];
  projectId: string | null;
  projectName: string | null | undefined;
  meetingId: string;
}

export function MeetingActionsView({ actions, projectId, projectName, meetingId }: MeetingActionsViewProps) {
  const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return formatShortDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Message principal avec bouton vers le projet */}
      {projectId ? (
        <FlowCard className="bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/30 border-blue-200/60">
          <FlowCardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Actions issues de cette réunion
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {actions.length === 0
                    ? "Aucune action créée depuis cette réunion."
                    : `${actions.length} action${actions.length > 1 ? "s" : ""} ${actions.length > 1 ? "ont été créées" : "a été créée"} depuis cette réunion.`}
                </p>
              </div>
              <Link href={`/app/projects/${projectId}/kanban`}>
                <Button
                  size="lg"
                  className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium px-8"
                >
                  <FolderKanban className="mr-2 h-5 w-5" />
                  Ouvrir dans le projet {projectName ? `"${projectName}"` : ""}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <FlowCard className="bg-amber-50/50 border-amber-200/60">
          <FlowCardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Aucun projet associé
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Pour voir toutes les actions dans un Kanban, rattachez cette réunion à un projet.
                </p>
              </div>
              <Link href={`/app/meetings/${meetingId}/analyze`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="font-medium px-8"
                >
                  Modifier la réunion
                </Button>
              </Link>
            </div>
          </FlowCardContent>
        </FlowCard>
      )}

      {/* Liste des actions */}
      {actions.length > 0 && (
        <FlowCard className="bg-white border-slate-200/60 shadow-sm">
          <FlowCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <FlowCardTitle className="text-lg font-semibold tracking-tight">
                  Actions issues de cette réunion
                </FlowCardTitle>
                <p className="text-sm text-slate-500 mt-0.5">
                  {actions.length} action{actions.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </FlowCardHeader>
          <FlowCardContent>
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 leading-snug">
                        {action.title}
                      </p>
                      <Badge 
                        variant={getActionStatusBadgeVariant(action.status)} 
                        className="text-xs"
                      >
                        {getActionStatusLabel(action.status)}
                      </Badge>
                    </div>
                    
                    {action.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {action.description}
                      </p>
                    )}

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                      {/* Responsable */}
                      {action.assignee ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{action.assignee.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Responsable manquant</span>
                        </div>
                      )}

                      {/* Date d'échéance */}
                      {action.dueDate ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(action.dueDate)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Date à définir</span>
                        </div>
                      )}

                      {/* Badge Décision */}
                      {action.decision && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {action.decision.title ? `Décision: ${action.decision.title}` : "Décision"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FlowCardContent>
        </FlowCard>
      )}
    </div>
  );
}

