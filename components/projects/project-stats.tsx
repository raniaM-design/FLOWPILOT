import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { CheckSquare2, Users, MessageSquareWarning, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  subtitle?: string;
  className?: string;
}

function StatCard({ icon, value, label, subtitle, className }: StatCardProps) {
  return (
    <FlowCard className={cn("", className)}>
      <FlowCardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl sm:text-3xl font-medium text-foreground mb-0.5 sm:mb-1">{value}</div>
                <div className="text-xs sm:text-sm font-medium text-foreground">{label}</div>
              </div>
            </div>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

interface ProjectStatsProps {
  openActions: number;
  decisions: number;
  meetings: number;
  pointsToClarify?: number;
}

export function ProjectStats({
  openActions,
  decisions,
  meetings,
  pointsToClarify = 0,
}: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <StatCard
        icon={<CheckSquare2 className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'hsl(var(--primary))' }} />}
        value={openActions}
        label="Actions ouvertes"
        subtitle="À faire cette semaine"
      />
      <StatCard
        icon={<MessageSquareWarning className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'hsl(var(--accent-decisions))' }} />}
        value={decisions}
        label="Décisions"
        subtitle="Documentées"
      />
      <StatCard
        icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'hsl(var(--success))' }} />}
        value={meetings}
        label="Réunions"
        subtitle="Enregistrées"
      />
      <StatCard
        icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'hsl(var(--warning))' }} />}
        value={pointsToClarify}
        label="Points à clarifier"
        subtitle="En attente"
      />
    </div>
  );
}

