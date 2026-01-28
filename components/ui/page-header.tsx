import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PageHeaderAction {
  label?: string; // Optionnel si component est fourni
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: React.ReactNode;
  component?: React.ReactNode; // Pour les composants clients complexes
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string | React.ReactNode;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: PageHeaderAction[];
}

/**
 * Composant PageHeader moderne et vibrant
 * Design énergique avec titre fort, sous-titre, badge optionnel et actions colorées
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {badge && (
            <Badge
              variant={badge.variant || "default"}
              className="text-sm font-medium px-3 py-1"
            >
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <div className="text-muted-foreground leading-relaxed max-w-2xl text-base">
            {typeof subtitle === "string" ? <p>{subtitle}</p> : subtitle}
          </div>
        )}
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {actions.map((action, index) => {
            // Si c'est un composant personnalisé, le rendre directement
            if (action.component) {
              return <React.Fragment key={index}>{action.component}</React.Fragment>;
            }
            
            const isPrimary = index === 0 && action.variant !== "outline" && action.variant !== "ghost";
            
            if (action.href) {
              return (
                <Button
                  key={index}
                  asChild
                  variant={isPrimary ? "default" : action.variant || "outline"}
                  size="default"
                  className={cn(
                    isPrimary && "bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white",
                    "font-medium"
                  )}
                >
                  <Link href={action.href}>
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Link>
                </Button>
              );
            }
            
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={isPrimary ? "default" : action.variant || "outline"}
                size="default"
                className={cn(
                  isPrimary && "bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white",
                  "font-medium"
                )}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
