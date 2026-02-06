import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface UseCaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  iconColor?: "blue" | "purple" | "emerald";
}

export function UseCaseCard({
  icon: Icon,
  title,
  description,
  benefits,
  iconColor = "blue",
  className,
  ...props
}: UseCaseCardProps) {
  // Color variants for icons
  const iconColorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600",
    emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600",
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
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
        {title}
      </h3>
      <p className="text-slate-700 mb-7 leading-relaxed text-base md:text-[17px] font-medium">
        {description}
      </p>
      <ul className="space-y-4">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3 text-base text-slate-700">
            <span className="text-blue-600 mt-0.5 font-bold text-lg flex-shrink-0">✓</span>
            <span className="leading-relaxed font-medium">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

