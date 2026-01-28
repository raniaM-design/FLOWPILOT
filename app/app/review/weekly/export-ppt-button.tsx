"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

/**
 * Composant client pour exporter la Weekly Review en PPTX
 */
export function ExportPptButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/app/review/weekly/export-ppt", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'export");
        }

        // Récupérer le blob
        const blob = await response.blob();
        
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `weekly-review-${new Date().toISOString().split("T")[0]}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erreur lors de l'export PPT:", error);
        alert("Erreur lors de l'export du fichier PPTX");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exporter en PPT
        </>
      )}
    </Button>
  );
}

