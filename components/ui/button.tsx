"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors duration-[120ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background active:opacity-[0.92]",
  {
    variants: {
      variant: {
        default: "bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8]",
        destructive: "bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C]",
        outline:
          "bg-section-bg/50 hover:bg-hover-bg hover:text-foreground",
        secondary: "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]",
        ghost: "hover:bg-[#F1F5F9] hover:text-[#0F172A]",
        link: "text-[#2563EB] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-[18px] py-[10px]",
        sm: "h-9 rounded-[8px] px-3",
        lg: "h-11 rounded-[8px] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Utiliser useEffect pour éviter les problèmes d'hydratation avec Slot
    const [isMounted, setIsMounted] = React.useState(false);
    
    React.useEffect(() => {
      setIsMounted(true);
    }, []);
    
    // Déterminer le composant à utiliser
    const Comp = asChild && isMounted ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        suppressHydrationWarning={asChild}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
