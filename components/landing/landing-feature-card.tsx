import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface LandingFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  benefit?: string;
  iconColor?: "blue" | "purple" | "emerald" | "amber";
  /** Affiche un badge si la fonctionnalité est partielle */
  comingSoon?: boolean;
  comingSoonLabel?: string;
}

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
};

export function LandingFeatureCard({
  icon: Icon,
  title,
  description,
  benefit,
  iconColor = "blue",
  comingSoon,
  comingSoonLabel = "En cours",
  className,
  ...props
}: LandingFeatureCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-blue-500/10 relative",
        className
      )}
      {...props}
    >
      {comingSoon && (
        <span className="absolute top-4 right-4 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200/60">
          {comingSoonLabel}
        </span>
      )}
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl mb-5",
          iconColorClasses[iconColor]
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-3">
        {description}
      </p>
      {benefit && (
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          {benefit}
        </p>
      )}
    </div>
  );
}
