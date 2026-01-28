"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface FormSubmitButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  loadingText?: string;
}

/**
 * Bouton de soumission de formulaire avec protection contre les doubles clics
 * Utilise useFormStatus pour détecter automatiquement l'état de soumission
 */
export function FormSubmitButton({
  children,
  className,
  variant = "default",
  size = "default",
  disabled = false,
  loadingText,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Traitement..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

