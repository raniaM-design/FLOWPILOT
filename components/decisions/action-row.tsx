import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { Calendar, FolderKanban } from "lucide-react";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";

interface ActionRowProps {
  action: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectId: string;
    project: { id: string; name: string };
  };
}

/**
 * Row moderne pour afficher une action liée
 */
export function ActionRow({ action }: ActionRowProps) {
  const dueMeta = getDueMeta(action.dueDate);
  const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
  
  // Déterminer le badge d'urgence avec styles doux mais visibles
  const getUrgencyBadge = () => {
    if (overdue) {
      return (
        <Chip 
          variant="danger" 
          size="sm"
          className="bg-red-50 text-red-700 border-red-200/60 font-medium"
        >
          En retard
        </Chip>
      );
    }
    if (dueMeta.kind === "TODAY") {
      return (
        <Chip 
          variant="warning" 
          size="sm"
          className="bg-amber-50 text-amber-700 border-amber-200/60 font-medium"
        >
          Aujourd'hui
        </Chip>
      );
    }
    if (dueMeta.kind === "THIS_WEEK" || dueMeta.kind === "SOON") {
      return (
        <Chip 
          variant="info" 
          size="sm"
          className="bg-blue-50 text-blue-700 border-blue-200/60"
        >
          Cette semaine
        </Chip>
      );
    }
    if (dueMeta.kind === "NONE") {
      return null;
    }
    return (
      <Chip 
        variant="neutral" 
        size="sm"
        className="bg-slate-50 text-slate-600 border-slate-200/60"
      >
        OK
      </Chip>
    );
  };

  return (
    <Link href={`/app/projects/${action.projectId}?actionId=${action.id}`} className="block group">
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 lg:p-6 hover:bg-gradient-to-br hover:from-blue-50/50 hover:via-white hover:to-blue-50/30 hover:border-blue-300/60 hover:shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-100/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base lg:text-lg text-slate-900 mb-3 leading-tight group-hover:text-blue-900 transition-colors">
              {action.title}
            </h4>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Chip 
                variant={
                  getActionStatusBadgeVariant(action.status) === "destructive" 
                    ? "danger" 
                    : getActionStatusBadgeVariant(action.status) === "secondary"
                    ? "warning"
                    : "neutral"
                } 
                size="sm"
                className={
                  getActionStatusBadgeVariant(action.status) === "destructive"
                    ? "bg-red-50 text-red-700 border-red-200/60 shadow-sm"
                    : getActionStatusBadgeVariant(action.status) === "secondary"
                    ? "bg-amber-50 text-amber-700 border-amber-200/60 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200/60 shadow-sm"
                }
              >
                {getActionStatusLabel(action.status)}
              </Chip>
              {getUrgencyBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <FolderKanban className="h-3.5 w-3.5" />
                {action.project.name}
              </span>
              {action.dueDate && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
          <ActionStatusWrapper>
            <ActionStatusButtons
              actionId={action.id}
              currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
            />
          </ActionStatusWrapper>
        </div>
      </div>
    </Link>
  );
}
