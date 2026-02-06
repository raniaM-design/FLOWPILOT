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
    <FlowCard variant="subtle" className="bg-white border-slate-200/80 shadow-md shadow-slate-200/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/20">
      <FlowCardHeader className="bg-gradient-to-r from-slate-50/60 via-white to-blue-50/20 border-b border-slate-200/60 px-6 lg:px-8 py-5">
        <FlowCardTitle className="text-base font-bold text-slate-800 tracking-tight">Traçabilité</FlowCardTitle>
      </FlowCardHeader>
      <FlowCardContent className="p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3 text-sm text-slate-700 bg-gradient-to-r from-slate-50/80 to-slate-50/40 rounded-lg p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-semibold">
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
          <div className="flex items-center gap-3 text-sm text-slate-700 bg-gradient-to-r from-slate-50/80 to-slate-50/40 rounded-lg p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold">Par {createdBy.email}</span>
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}
