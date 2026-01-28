import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Calendar, User } from "lucide-react";

interface DecisionTimelineProps {
  createdAt: Date;
  createdBy?: {
    email: string;
  } | null;
}

/**
 * Bloc "Timeline / Traçabilité" simple
 */
export function DecisionTimeline({ createdAt, createdBy }: DecisionTimelineProps) {
  return (
    <FlowCard variant="subtle" className="bg-slate-50/50 border-slate-200/60 shadow-sm">
      <FlowCardHeader>
        <FlowCardTitle className="text-sm font-semibold text-slate-700 tracking-tight">Traçabilité</FlowCardTitle>
      </FlowCardHeader>
      <FlowCardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            Créée le {new Date(createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {createdBy && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span>Par {createdBy.email}</span>
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}
