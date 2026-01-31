"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export default function SubmitButton({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  // useFormStatus nécessite un Server Action, mais on peut l'utiliser avec un fallback
  let pending = false;
  try {
    const status = useFormStatus();
    pending = status.pending;
  } catch (e) {
    // Si useFormStatus échoue (formulaire HTML standard), on utilise un état local
    // Ceci est géré par le composant parent si nécessaire
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <button
      type="submit"
      disabled={pending || isSubmitting}
      onClick={() => setIsSubmitting(true)}
      className={cn(
        "w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {(pending || isSubmitting) ? "Connexion..." : children}
    </button>
  );
}
