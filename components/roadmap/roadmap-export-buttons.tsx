"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Download, Loader2 } from "lucide-react";
import { exportRoadmapToPdf, exportRoadmapToPpt } from "@/lib/roadmap/export";

interface RoadmapExportButtonsProps {
  projectName: string;
}

export function RoadmapExportButtons({ projectName }: RoadmapExportButtonsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportRoadmapToPdf(projectName);
      // Succès silencieux (le téléchargement démarre automatiquement)
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportRoadmapToPpt(projectName);
      // Succès silencieux (le téléchargement démarre automatiquement)
    } catch (error) {
      console.error("Erreur export PPT:", error);
      alert("Erreur lors de l'export PPT. Veuillez réessayer.");
    } finally {
      setIsExportingPpt(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExportPdf}
        disabled={isExportingPdf || isExportingPpt}
        variant="outline"
        size="sm"
      >
        {isExportingPdf ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Export...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            Exporter en PDF
          </>
        )}
      </Button>
      <Button
        onClick={handleExportPpt}
        disabled={isExportingPdf || isExportingPpt}
        variant="outline"
        size="sm"
      >
        {isExportingPpt ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Export...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exporter en PPT
          </>
        )}
      </Button>
    </div>
  );
}

