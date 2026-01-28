import * as React from "react";
import { cn } from "@/lib/utils";

export interface FlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "subtle";
  interactive?: boolean;
}

const FlowCard = React.forwardRef<HTMLDivElement, FlowCardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => {
    const variantStyles = {
      default: "bg-card shadow-premium text-foreground",
      elevated: "bg-card shadow-premium-lg text-foreground",
      outlined: "bg-section-bg/50 shadow-premium text-foreground",
      subtle: "bg-section-bg/30 shadow-premium text-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-6 transition-all duration-150 ease-out",
          variantStyles[variant],
          interactive && "cursor-pointer hover:bg-hover-bg",
          className
        )}
        {...props}
      />
    );
  }
);
FlowCard.displayName = "FlowCard";

const FlowCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 mb-4", className)}
    {...props}
  />
));
FlowCardHeader.displayName = "FlowCardHeader";

const FlowCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
FlowCardTitle.displayName = "FlowCardTitle";

const FlowCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    style={{ lineHeight: "1.6" }}
    {...props}
  />
));
FlowCardDescription.displayName = "FlowCardDescription";

const FlowCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
FlowCardContent.displayName = "FlowCardContent";

const FlowCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 mt-4 pt-4", className)}
    {...props}
  />
));
FlowCardFooter.displayName = "FlowCardFooter";

export {
  FlowCard,
  FlowCardHeader,
  FlowCardTitle,
  FlowCardDescription,
  FlowCardContent,
  FlowCardFooter,
};

