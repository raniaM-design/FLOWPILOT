"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { exportGanttToPdf } from "@/lib/gantt/export";

interface GanttExportButtonsProps {
  projectName: string;
}

export function GanttExportButtons({ projectName }: GanttExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportGanttToPdf(projectName);
    } catch (error) {
      console.error("Erreur export PDF Gantt:", error);
      alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPdf}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
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
  );
}
