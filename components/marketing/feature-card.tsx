import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: "blue" | "purple" | "emerald";
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor = "blue",
  className,
  ...props
}: FeatureCardProps) {
  // Color variants for icons
  const iconColorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  
  const iconColorClass = iconColorClasses[iconColor];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-blue-500/10",
        className
      )}
      {...props}
    >
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl mb-6", iconColorClass)}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-3 leading-tight">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed text-[15px]">
        {description}
      </p>
    </div>
  );
}

