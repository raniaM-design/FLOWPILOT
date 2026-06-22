"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImpersonationBannerProps {
  userEmail: string;
}

export function ImpersonationBanner({ userEmail }: ImpersonationBannerProps) {
  const handleStop = async () => {
    try {
      const response = await fetch("/api/support/stop-impersonate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur");
      }
      window.location.href = data.redirectTo || "/admin";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la sortie");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Mode assistance : vous êtes connecté en tant que <strong>{userEmail}</strong>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          className="shrink-0 border-amber-700 bg-amber-50 text-amber-950 hover:bg-amber-100"
        >
          <X className="h-4 w-4 mr-1" />
          Revenir à mon compte
        </Button>
      </div>
    </div>
  );
}
