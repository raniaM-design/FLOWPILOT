import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "./types";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Génère un PPT premium pour la Monthly Review
 */
export async function generateMonthlyReviewPpt(
  data: MonthlyReviewExportData,
  charts: { activityPng: Buffer | null; statusPng: Buffer | null; projectsPng: Buffer | null }
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Helper pour tronquer le texte
  const truncateText = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + "…";
  };

  // SLIDE 1: Cover
  const slide1 = pptx.addSlide();

  // Logo PILOTYS
  try {
    const logoPath = join(__dirname, "../../../../public", LOGO_OFFICIAL_PATH.replace(/^\//, ""));
    const logoBuffer = await readFile(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    const logoHeight = 0.8;
    const logoWidth = logoHeight * LOGO_OFFICIAL_DIMENSIONS.ratio;
    slide1.addImage({
      data: `data:image/svg+xml;base64,${logoBase64}`,
      x: 0.5,
      y: 0.5,
      w: logoWidth,
      h: logoHeight,
    });
  } catch (error) {
    console.warn("Logo non disponible pour l'export PPT:", error);
  }

  // Titre
  slide1.addText("Monthly Review", {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 1.0,
    fontSize: 44,
    bold: true,
    color: "363636",
    fontFace: "Arial",
    align: "center",
  });

  // Période
  slide1.addText(data.period.label, {
    x: 0.5,
    y: 3.0,
    w: 9,
    h: 0.6,
    fontSize: 24,
    color: "64748B",
    fontFace: "Arial",
    align: "center",
  });

  // Tagline
  slide1.addText("Vue d'ensemble de l'activité du mois et avancement des projets", {
    x: 0.5,
    y: 4.0,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: "94A3B8",
    fontFace: "Arial",
    align: "center",
  });

  // SLIDE 2: Executive Summary + KPIs
  const slide2 = pptx.addSlide();

  // Résumé exécutif
  slide2.addText("Executive Summary", {
    x: 0.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: "2196F3",
    fontFace: "Arial",
  });

  slide2.addText(truncateText(data.summary, 200), {
    x: 0.5,
    y: 1.1,
    w: 4.5,
    h: 2.5,
    fontSize: 11,
    color: "363636",
    fontFace: "Arial",
    valign: "top",
  });

  // KPIs Cards
  slide2.addText("Key Indicators", {
    x: 5.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: "2196F3",
    fontFace: "Arial",
  });

  const kpiYPositions = [1.1, 1.1, 2.3, 2.3];
  const kpiXPositions = [5.5, 7.5, 5.5, 7.5];
  const kpiCards = [
    { label: "Réunions", value: data.kpis.meetings, color: "3B82F6" },
    { label: "Actions terminées", value: data.kpis.actionsDone, color: "22C55E" },
    { label: "Actions en retard", value: data.kpis.actionsOverdue, color: "EF4444" },
    { label: "Décisions", value: data.kpis.decisions, color: "8B5CF6" },
  ];

  kpiCards.forEach((kpi, i) => {
    const x = kpiXPositions[i];
    const y = kpiYPositions[i];

    // Card background
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: y,
      w: 2.0,
      h: 1.0,
      fill: { color: "F8F9FA" },
      line: { color: kpi.color, width: 1 },
      rectRadius: 0.1,
    });

    // Label
    slide2.addText(kpi.label, {
      x: x + 0.1,
      y: y + 0.1,
      w: 1.8,
      h: 0.3,
      fontSize: 9,
      color: "64748B",
      fontFace: "Arial",
    });

    // Value
    slide2.addText(String(kpi.value), {
      x: x + 0.1,
      y: y + 0.5,
      w: 1.8,
      h: 0.4,
      fontSize: 24,
      bold: true,
      color: kpi.color,
      fontFace: "Arial",
    });
  });

  // SLIDE 3: Activity chart + Action status chart
  const slide3 = pptx.addSlide();

  slide3.addText("Activity by Week", {
    x: 0.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: "2196F3",
    fontFace: "Arial",
  });

  // Graphique activité (PNG)
  if (charts.activityPng && charts.activityPng.length > 0) {
    try {
      const base64 = charts.activityPng.toString("base64");
      const activityDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPpt] Activity chart base64 length: ${base64.length}, buffer size: ${charts.activityPng.length} bytes`);
      slide3.addImage({
        data: activityDataUri,
        x: 0.5,
        y: 1.1,
        w: 4.5,
        h: 3.5,
      });
      console.log(`[exportPpt] Activity chart added successfully`);
    } catch (error) {
      console.warn("[exportPpt] Erreur lors de l'ajout du graphique activité:", error);
      if (error instanceof Error) {
        console.warn("[exportPpt] Error details:", error.message, error.stack);
      }
      slide3.addText("Activity chart unavailable", {
        x: 0.5,
        y: 1.1,
        w: 4.5,
        h: 3.5,
        fontSize: 12,
        color: "94A3B8",
        fontFace: "Arial",
      });
    }
  } else {
    console.warn(`[exportPpt] Activity chart buffer missing or empty (buffer: ${charts.activityPng ? charts.activityPng.length : 'null'})`);
    slide3.addText("Activity chart unavailable", {
      x: 0.5,
      y: 1.1,
      w: 4.5,
      h: 3.5,
      fontSize: 12,
      color: "94A3B8",
      fontFace: "Arial",
    });
  }

  slide3.addText("Action Status", {
    x: 5.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: "2196F3",
    fontFace: "Arial",
  });

  // Graphique statut (PNG)
  if (charts.statusPng && charts.statusPng.length > 0) {
    try {
      const base64 = charts.statusPng.toString("base64");
      const statusDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPpt] Status chart base64 length: ${base64.length}, buffer size: ${charts.statusPng.length} bytes`);
      slide3.addImage({
        data: statusDataUri,
        x: 5.5,
        y: 1.1,
        w: 4.5,
        h: 3.5,
      });
      console.log(`[exportPpt] Status chart added successfully`);
    } catch (error) {
      console.warn("[exportPpt] Erreur lors de l'ajout du graphique statut:", error);
      if (error instanceof Error) {
        console.warn("[exportPpt] Error details:", error.message, error.stack);
      }
      slide3.addText("Status chart unavailable", {
        x: 5.5,
        y: 1.1,
        w: 4.5,
        h: 3.5,
        fontSize: 12,
        color: "94A3B8",
        fontFace: "Arial",
      });
    }
  } else {
    console.warn(`[exportPpt] Status chart buffer missing or empty (buffer: ${charts.statusPng ? charts.statusPng.length : 'null'})`);
    slide3.addText("Status chart unavailable", {
      x: 5.5,
      y: 1.1,
      w: 4.5,
      h: 3.5,
      fontSize: 12,
      color: "94A3B8",
      fontFace: "Arial",
    });
  }

  // SLIDE 4: Project progress chart + Top projects
  const slide4 = pptx.addSlide();

  slide4.addText("Projects Progress", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: "2196F3",
    fontFace: "Arial",
  });

  // Graphique projets (PNG)
  if (charts.projectsPng && charts.projectsPng.length > 0) {
    try {
      const base64 = charts.projectsPng.toString("base64");
      const projectsDataUri = `data:image/png;base64,${base64}`;
      console.log(`[exportPpt] Projects chart base64 length: ${base64.length}, buffer size: ${charts.projectsPng.length} bytes`);
      slide4.addImage({
        data: projectsDataUri,
        x: 0.5,
        y: 1.1,
        w: 9,
        h: 3.0,
      });
      console.log(`[exportPpt] Projects chart added successfully`);
    } catch (error) {
      console.warn("[exportPpt] Erreur lors de l'ajout du graphique projets:", error);
      if (error instanceof Error) {
        console.warn("[exportPpt] Error details:", error.message, error.stack);
      }
      slide4.addText("Projects chart unavailable", {
        x: 0.5,
        y: 1.1,
        w: 9,
        h: 3.0,
        fontSize: 12,
        color: "94A3B8",
        fontFace: "Arial",
      });
    }
  } else {
    console.warn(`[exportPpt] Projects chart buffer missing or empty (buffer: ${charts.projectsPng ? charts.projectsPng.length : 'null'})`);
    slide4.addText("Projects chart unavailable", {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 3.0,
      fontSize: 12,
      color: "94A3B8",
      fontFace: "Arial",
    });
  }

  // Top projets list
  const topProjectsText = data.charts.projectProgress
    .slice(0, 5)
    .map((p) => {
      const statusEmoji =
        p.status === "on_track" ? "✓" : p.status === "at_risk" ? "⚠" : "✗";
      return `${statusEmoji} ${truncateText(p.name, 35)}: ${p.completionRate}%`;
    })
    .join("\n");

  slide4.addText(topProjectsText || "Aucun projet", {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 1.5,
    fontSize: 11,
    color: "363636",
    fontFace: "Arial",
    valign: "top",
  });

  // SLIDE 5: Key decisions
  if (data.highlights.keyDecisions.length > 0) {
    const slide5 = pptx.addSlide();

    slide5.addText("Key Decisions", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "2196F3",
      fontFace: "Arial",
    });

    const decisionsText = data.highlights.keyDecisions
      .slice(0, 6)
      .map((d) => `• ${truncateText(d.title, 50)}${d.projectName ? ` (${d.projectName})` : ""} — ${d.date}`)
      .join("\n");

    slide5.addText(decisionsText, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4.5,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });
  }

  // SLIDE 6: Next month focus
  if (data.highlights.nextMonthFocus.length > 0) {
    const slide6 = pptx.addSlide();

    slide6.addText("Next Month Focus", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "2196F3",
      fontFace: "Arial",
    });

    const focusText = data.highlights.nextMonthFocus
      .slice(0, 6)
      .map((item) => {
        const parts = [
          `• ${truncateText(item.title, 45)}`,
          item.projectName && `(${item.projectName})`,
          item.dueDate && `Due: ${item.dueDate}`,
        ].filter(Boolean);
        return parts.join(" — ");
      })
      .join("\n");

    slide6.addText(focusText || "Aucun élément", {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4.5,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });
  }

  // Générer le buffer
  // Utiliser "arraybuffer" puis convertir en Buffer (plus fiable que "nodebuffer")
  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" });
  const uint8Array = new Uint8Array(arrayBuffer as ArrayBuffer);
  const buffer = Buffer.from(uint8Array);
  
  // Valider que c'est bien un ZIP (PPTX est un ZIP)
  if (buffer.length < 2 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error(`Invalid PPTX buffer: does not start with PK (ZIP signature). First bytes: ${buffer.slice(0, 4).toString("hex")}`);
  }
  
  return buffer;
}

