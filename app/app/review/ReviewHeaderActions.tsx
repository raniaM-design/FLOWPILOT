"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Presentation, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadFromApi } from "@/lib/export/downloadFile";

type ReviewPeriod = "week" | "month";

interface ReviewHeaderActionsProps {
  period: ReviewPeriod;
}

export function ReviewHeaderActions({ period }: ReviewHeaderActionsProps) {
  const [isPendingPdf, setIsPendingPdf] = useState(false);
  const [isPendingPpt, setIsPendingPpt] = useState(false);
  const t = useTranslations("review");

  const handleExportPdf = async () => {
    if (period === "week") {
      // Ouvrir la page print dans un nouvel onglet
      window.open("/app/review/weekly/print", "_blank");
    } else {
      // Monthly: télécharger le PDF directement
      setIsPendingPdf(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const filename = `monthly-review-${year}-${month}.pdf`;
        await downloadFromApi("/app/review/monthly/export-pdf", filename);
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(errorMessage || t("exportError") || "Erreur lors de l'export");
      } finally {
        setIsPendingPdf(false);
      }
    }
  };

  const handleExportPpt = async () => {
    if (period === "week") {
      setIsPendingPpt(true);
      try {
        const now = new Date();
        const filename = `weekly-review-${now.toISOString().split("T")[0]}.pptx`;
        await downloadFromApi("/app/review/weekly/export-ppt", filename);
      } catch (error) {
        console.error("Erreur lors de l'export PPT:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(errorMessage || t("exportError") || "Erreur lors de l'export");
      } finally {
        setIsPendingPpt(false);
      }
    } else {
      // Monthly: export PPT
      setIsPendingPpt(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const filename = `monthly-review-${year}-${month}.pptx`;
        await downloadFromApi("/app/review/monthly/export-ppt", filename);
      } catch (error) {
        console.error("Erreur lors de l'export PPT:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(errorMessage || t("exportError") || "Erreur lors de l'export");
      } finally {
        setIsPendingPpt(false);
      }
    }
  };

  const isPending = isPendingPdf || isPendingPpt;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPendingPdf 
                ? (t("exportingPdf") || t("exporting") || "Export PDF...")
                : (t("exportingPpt") || t("exporting") || "Export PPT...")
              }
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-[#E5E7EB]">
        <DropdownMenuItem 
          onClick={handleExportPdf} 
          disabled={isPendingPdf}
          className="text-[#111111] hover:bg-[#F1F5F9]"
        >
          {isPendingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("exportingPdf") || t("exporting") || "Export en cours..."}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {t("exportPdf")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPpt} 
          disabled={isPendingPpt}
          className="text-[#111111] hover:bg-[#F1F5F9]"
        >
          {isPendingPpt ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("exportingPpt") || t("exporting") || "Export en cours..."}
            </>
          ) : (
            <>
              <Presentation className="mr-2 h-4 w-4" />
              {t("exportPpt")}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

