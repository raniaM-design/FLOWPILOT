"use client";

import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";

export default function SubmitButton({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLButtonElement>) => {
    setIsSubmitting(true);
    // Le formulaire se soumettra normalement
    // Si la soumission échoue, on réinitialisera l'état après un délai
    setTimeout(() => {
      setIsSubmitting(false);
    }, 5000); // Timeout de sécurité
  };

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      onClick={handleSubmit}
      className={cn(
        "w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isSubmitting ? "Connexion..." : children}
    </button>
  );
}
