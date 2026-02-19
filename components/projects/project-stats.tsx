import { CheckSquare2, Users, MessageSquareWarning, Calendar, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* KPI cards — couleurs sémantiques (info/success/warning) + style dashboard premium */

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  subtitle?: string;
  variant?: "info" | "success" | "warning" | "neutral";
  className?: string;
}

const variantStyles = {
  info: { iconBg: "bg-blue-100 dark:bg-blue-900/50", iconColor: "text-blue-600 dark:text-blue-400" },
  success: { iconBg: "bg-emerald-100 dark:bg-emerald-900/50", iconColor: "text-emerald-600 dark:text-emerald-400" },
  warning: { iconBg: "bg-amber-100 dark:bg-amber-900/50", iconColor: "text-amber-600 dark:text-amber-400" },
  neutral: { iconBg: "bg-slate-100 dark:bg-slate-700/50", iconColor: "text-slate-600 dark:text-slate-400" },
} as const;

function StatCard({ icon, value, label, subtitle, variant = "neutral", className }: StatCardProps) {
  const styles = variantStyles[variant];
  const isWarning = variant === "warning";
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm p-5 sm:p-6",
        "transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        isWarning
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-700/50"
          : "bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/60",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums mb-0.5 text-foreground">{value}</div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
      <StatCard
        icon={<CheckSquare2 className="h-5 w-5" />}
        value={openActions}
        label="Actions ouvertes"
        subtitle="À faire"
        variant="info"
      />
      <StatCard
        icon={<MessageSquareWarning className="h-5 w-5" />}
        value={decisions}
        label="Décisions"
        subtitle="Documentées"
        variant="neutral"
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        value={meetings}
        label="Réunions"
        subtitle="Enregistrées"
        variant="success"
      />
      <StatCard
        icon={<HelpCircle className="h-5 w-5" />}
        value={pointsToClarify}
        label="Points à clarifier"
        subtitle="En attente"
        variant="warning"
      />
    </div>
  );
}

