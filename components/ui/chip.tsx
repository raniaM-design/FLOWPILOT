import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Composant Chip premium - Badge moderne avec style rounded-full
 * Utilisé pour afficher statuts, risques, urgences de manière cohérente
 * 
 * @example
 * <Chip variant="warning">En retard</Chip>
 * <Chip variant="success" size="sm">Terminée</Chip>
 */
const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full text-xs font-medium focus:outline-none",
  {
    variants: {
      variant: {
        neutral:
          "bg-[#F1F5F9] text-[#475569]",
        success:
          "bg-[#DCFCE7] text-[#166534]",
        warning:
          "bg-[#FEF3C7] text-[#92400E]",
        danger:
          "bg-[#FEE2E2] text-[#991B1B]",
        info:
          "bg-[#EFF6FF] text-[#2563EB]",
      },
      size: {
        sm: "h-5 px-3 text-xs",
        md: "h-6 px-3 text-xs",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, variant, size, ...props }: ChipProps) {
  return (
    <div
      className={cn(chipVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Chip, chipVariants };

