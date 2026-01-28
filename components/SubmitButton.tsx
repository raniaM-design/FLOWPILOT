"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export default function SubmitButton({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {pending ? "Connexion..." : children}
    </button>
  );
}
