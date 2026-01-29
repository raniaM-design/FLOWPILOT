import "server-only";
import jsPDF from "jspdf";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "./types";

/**
 * Génère un PDF premium pour la Monthly Review
 */
export async function generateMonthlyReviewPdf(
  data: MonthlyReviewExportData,
  charts: { activityPng: Buffer | null; statusPng: Buffer | null; projectsPng: Buffer | null }
): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Charger le logo PNG officiel une seule fois pour toutes les pages
  let logoBase64: string | null = null;
  try {
    // Utiliser le logo PNG officiel depuis branding (depuis lib/assets au lieu de public)
    const logoUrl = new URL("../../assets/branding/logo-full.png", import.meta.url);
    const logoPath = fileURLToPath(logoUrl);
    const logoBuffer = await readFile(logoPath);
    logoBase64 = logoBuffer.toString("base64");
  } catch (error) {
    console.error("Erreur lors du chargement du logo officiel pour PDF:", error);
    // Fallback : continuer sans logo plutôt que de faire planter l'export
    console.warn("Le logo officiel PILOTYS n'a pas pu être chargé. L'export PDF continuera sans logo.");
    logoBase64 = null;
  }

  // Fonction pour ajouter le logo en haut de page
  const addLogoToPage = () => {
    if (logoBase64) {
      try {
        pdf.addImage(
          `data:image/png;base64,${logoBase64}`,
          "PNG",
          margin,
          10, // Positionné en haut de la page
          40,
          12
        );
      } catch (error) {
        console.warn("Erreur lors de l'ajout du logo:", error);
      }
    }
  };

  // Helper pour ajouter une nouvelle page si nécessaire (avec logo)
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      addLogoToPage(); // Ajouter le logo sur la nouvelle page
      yPos = margin + 18; // Commencer après le logo
      return true;
    }
    return false;
  };

  // Logo PILOTYS sur la première page
  addLogoToPage();
  yPos += 18;

  // Titre principal
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Monthly Review", margin, yPos);
  yPos += 8;

  // Période
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(data.period.label, margin, yPos);
  pdf.setTextColor(0, 0, 0);
  yPos += 12;

  // Ligne de séparation
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // PAGE 1: Executive Summary + KPIs
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Executive Summary", margin, yPos);
  yPos += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 10;

  // KPIs Cards
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Key Indicators", margin, yPos);
  yPos += 8;

  const kpiCards = [
    { label: "Réunions", value: data.kpis.meetings, color: [37, 99, 235] },
    { label: "Actions terminées", value: data.kpis.actionsDone, color: [34, 197, 94] },
    { label: "Actions en retard", value: data.kpis.actionsOverdue, color: [239, 68, 68] },
    { label: "Décisions", value: data.kpis.decisions, color: [139, 92, 246] },
  ];

  const cardWidth = (contentWidth - 15) / 4;
  const cardHeight = 25;
  let xPos = margin;

  kpiCards.forEach((kpi, index) => {
    if (index > 0 && index % 2 === 0) {
      xPos = margin;
      yPos += cardHeight + 5;
    }

    // Card background
    pdf.setFillColor(250, 250, 250);
    pdf.roundedRect(xPos, yPos - cardHeight + 5, cardWidth, cardHeight, 2, 2, "F");

    // Border
    pdf.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(xPos, yPos - cardHeight + 5, cardWidth, cardHeight, 2, 2, "D");

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(kpi.label, xPos + 3, yPos - cardHeight + 12, { maxWidth: cardWidth - 6 });

    // Value
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.text(String(kpi.value), xPos + 3, yPos - 3);

    pdf.setTextColor(0, 0, 0);
    xPos += cardWidth + 5;
  });

  yPos += cardHeight + 15;

  // PAGE 2: Graphiques
  checkNewPage(120);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Activity Overview", margin, yPos);
  yPos += 8;

  // Graphique activité par semaine (PNG)
  if (charts.activityPng && charts.activityPng.length > 0) {
    try {
      const base64 = charts.activityPng.toString("base64");
      const activityDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPdf] Activity chart base64 length: ${base64.length}, buffer size: ${charts.activityPng.length} bytes`);
      pdf.addImage(activityDataUri, "PNG", margin, yPos, contentWidth, 80);
      yPos += 85;
      console.log(`[exportPdf] Activity chart added successfully`);
    } catch (error) {
      console.warn("[exportPdf] Erreur lors de l'ajout du graphique activité:", error);
      if (error instanceof Error) {
        console.warn("[exportPdf] Error details:", error.message, error.stack);
      }
      pdf.setFontSize(11);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Activity chart unavailable", margin, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 20;
    }
  } else {
    console.warn(`[exportPdf] Activity chart buffer missing or empty (buffer: ${charts.activityPng ? charts.activityPng.length : 'null'})`);
    pdf.setFontSize(11);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Activity chart unavailable", margin, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 20;
  }

  checkNewPage(120);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Action Status Distribution", margin, yPos);
  yPos += 8;

  // Graphique répartition actions (PNG)
  if (charts.statusPng && charts.statusPng.length > 0) {
    try {
      const base64 = charts.statusPng.toString("base64");
      const statusDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPdf] Status chart base64 length: ${base64.length}, buffer size: ${charts.statusPng.length} bytes`);
      pdf.addImage(statusDataUri, "PNG", margin, yPos, contentWidth / 2, 80);
      yPos += 85;
      console.log(`[exportPdf] Status chart added successfully`);
    } catch (error) {
      console.warn("[exportPdf] Erreur lors de l'ajout du graphique statut:", error);
      if (error instanceof Error) {
        console.warn("[exportPdf] Error details:", error.message, error.stack);
      }
      pdf.setFontSize(11);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Status chart unavailable", margin, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 20;
    }
  } else {
    console.warn(`[exportPdf] Status chart buffer missing or empty (buffer: ${charts.statusPng ? charts.statusPng.length : 'null'})`);
    pdf.setFontSize(11);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Status chart unavailable", margin, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 20;
  }

  // PAGE 3: Avancement projets
  checkNewPage(150);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Projects Progress", margin, yPos);
  yPos += 8;

  // Graphique avancement projets (PNG)
  if (charts.projectsPng && charts.projectsPng.length > 0) {
    try {
      const base64 = charts.projectsPng.toString("base64");
      const projectsDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPdf] Projects chart base64 length: ${base64.length}, buffer size: ${charts.projectsPng.length} bytes`);
      pdf.addImage(projectsDataUri, "PNG", margin, yPos, contentWidth, 100);
      yPos += 105;
      console.log(`[exportPdf] Projects chart added successfully`);
    } catch (error) {
      console.warn("[exportPdf] Erreur lors de l'ajout du graphique projets:", error);
      if (error instanceof Error) {
        console.warn("[exportPdf] Error details:", error.message, error.stack);
      }
      pdf.setFontSize(11);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Projects chart unavailable", margin, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 20;
    }
  } else {
    console.warn(`[exportPdf] Projects chart buffer missing or empty (buffer: ${charts.projectsPng ? charts.projectsPng.length : 'null'})`);
    pdf.setFontSize(11);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Projects chart unavailable", margin, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 20;
  }

  // Top 5 projets
  checkNewPage(80);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Top Projects", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  data.charts.projectProgress.slice(0, 5).forEach((project) => {
    checkNewPage(15);
    const statusColor =
      project.status === "on_track"
        ? [34, 197, 94]
        : project.status === "at_risk"
        ? [245, 158, 11]
        : [239, 68, 68];

    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(
      `${project.name}: ${project.completionRate}% (${project.done}/${project.total} actions)`,
      margin + 5,
      yPos
    );
    pdf.setTextColor(0, 0, 0);
    yPos += 6;
  });

  yPos += 5;

  // PAGE 4: Décisions clés + Focus mois prochain
  checkNewPage(100);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Key Decisions", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  data.highlights.keyDecisions.forEach((decision) => {
    checkNewPage(15);
    pdf.setFont("helvetica", "bold");
    pdf.text(`• ${decision.title}`, margin + 5, yPos);
    yPos += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${decision.projectName || ""} — ${decision.date}`,
      margin + 10,
      yPos
    );
    pdf.setTextColor(0, 0, 0);
    yPos += 8;
  });

  yPos += 5;

  // Focus mois prochain
  checkNewPage(100);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Next Month Focus", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  data.highlights.nextMonthFocus.forEach((item) => {
    checkNewPage(15);
    pdf.setFont("helvetica", "bold");
    pdf.text(`• ${item.title}`, margin + 5, yPos);
    yPos += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    const meta = [
      item.projectName,
      item.dueDate && `Due: ${item.dueDate}`,
    ]
      .filter(Boolean)
      .join(" — ");
    if (meta) {
      pdf.text(meta, margin + 10, yPos);
      yPos += 5;
    }
    pdf.setTextColor(0, 0, 0);
    yPos += 5;
  });

  // Footer sur chaque page
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated by PILOTYS — ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return Buffer.from(pdf.output("arraybuffer"));
}

