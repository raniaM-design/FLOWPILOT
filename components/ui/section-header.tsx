import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function SectionHeader({
  title,
  description,
  action,
  size = "md",
  className,
  ...props
}: SectionHeaderProps) {
  const sizeStyles = {
    sm: {
      title: "text-base font-semibold",
      description: "text-xs",
      spacing: "mb-3",
    },
    md: {
      title: "text-lg font-semibold",
      description: "text-sm",
      spacing: "mb-4",
    },
    lg: {
      title: "text-xl font-semibold",
      description: "text-sm",
      spacing: "mb-5",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn("flex items-start justify-between gap-4", styles.spacing, className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <h2 className={cn(styles.title, "text-foreground mb-1")}>
          {title}
        </h2>
        {description && (
          <p className={cn(styles.description, "text-muted-foreground leading-relaxed")}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

