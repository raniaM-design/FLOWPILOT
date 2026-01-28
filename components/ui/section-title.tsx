import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  count?: number;
  size?: "sm" | "md" | "lg";
  accentColor?: "amber" | "red" | "green" | "blue" | "neutral";
  icon?: React.ReactNode;
}

/**
 * Composant réutilisable pour les titres de section avec sous-titre et compteur optionnels
 * Design moderne et hiérarchisé
 */
export function SectionTitle({
  title,
  subtitle,
  count,
  size = "md",
  accentColor = "neutral",
  icon,
  className,
  ...props
}: SectionTitleProps) {
  const accentStyles = {
    amber: {
      iconBg: "bg-[#FEF3C7]/60",
      iconColor: "text-[#D97706]/80",
    },
    red: {
      iconBg: "bg-[#FEE2E2]/50",
      iconColor: "text-[#DC2626]/80",
    },
    green: {
      iconBg: "bg-[#DCFCE7]/60",
      iconColor: "text-[#16A34A]/80",
    },
    blue: {
      iconBg: "bg-[#EFF6FF]/60",
      iconColor: "text-[#2563EB]/90",
    },
    neutral: {
      iconBg: "bg-[#F1F5F9]/60",
      iconColor: "text-[#475569]",
    },
  };

  const accent = accentStyles[accentColor];
  const sizeStyles = {
    sm: {
      title: "text-lg font-semibold tracking-tight",
      subtitle: "text-xs",
      spacing: "mb-4",
    },
    md: {
      title: "text-xl font-semibold tracking-tight",
      subtitle: "text-sm",
      spacing: "mb-5",
    },
    lg: {
      title: "text-2xl font-semibold tracking-tight",
      subtitle: "text-sm",
      spacing: "mb-6",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn("space-y-2", styles.spacing, className)}
      {...props}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            accent.iconBg
          )}>
            <div className={accent.iconColor}>
              {icon}
            </div>
          </div>
        )}
        <h2 className={cn(styles.title, "text-foreground font-medium")}>
          {title}
        </h2>
        {count !== undefined && (
          <span className={cn(
            "inline-flex items-center justify-center min-w-[24px] h-6 px-3 rounded-full text-xs font-medium",
            accentColor !== "neutral" 
              ? `${accent.iconBg} ${accent.iconColor}`
              : "bg-[#F1F5F9]/60 text-[#475569]"
          )}>
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <p className={cn(styles.subtitle, "text-text-secondary leading-relaxed font-normal")} style={{ lineHeight: "1.6" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
