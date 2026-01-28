import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { buildMonthlyReviewData } from "@/lib/review/monthly/buildMonthlyReviewData";
import { generateAllChartsPNG } from "@/lib/review/monthly/generate-charts";
import { generateAllChartsSVG } from "@/lib/review/monthly/generate-charts-svg";
import { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { LOGO_OFFICIAL_PATH } from "@/lib/logo-config";

// Forcer le runtime Node.js pour accéder au filesystem
export const runtime = "nodejs";

/**
 * Route Handler pour exporter la Monthly Review en PDF
 * POST /app/review/monthly/export-pdf
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    // Dates pour le mois courant
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const locale = "fr"; // TODO: récupérer depuis les headers ou query params

    // Construire les données de la monthly review
    const data = await buildMonthlyReviewData({
      year,
      month,
      locale,
      userId,
    });

    // Générer les graphiques - Essayer d'abord Chart.js, puis fallback SVG
    let charts = await generateAllChartsPNG(data);
    
    // Si Chart.js n'a pas fonctionné, utiliser SVG
    if (!charts.activity || charts.activity.length === 0) {
      console.log("[monthly-pdf] Chart.js failed, using SVG fallback");
      charts = await generateAllChartsSVG(data);
    }
    
    // Log pour déboguer
    console.log("[monthly-pdf] Charts generated:", {
      activity: charts.activity ? `${charts.activity.length} bytes` : "null",
      status: charts.status ? `${charts.status.length} bytes` : "null",
      projects: charts.projects ? `${charts.projects.length} bytes` : "null",
    });

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ===== CONSTANTES DE DESIGN (style Notion/Linear) =====
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // Marges réduites pour plus d'espace
    const contentWidth = pageWidth - 2 * margin;
    const spacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    };
    const colors = {
      text: [17, 17, 17], // #111
      textMuted: [102, 102, 102], // #666
      divider: [230, 230, 230], // très light
      border: [240, 240, 240], // très light
      blue: [59, 130, 246], // blue-500
    };
    const fonts = {
      h1: 20, // Titre principal
      h2: 13, // Titre de section
      body: 10, // Texte principal
      muted: 9, // Texte secondaire
    };
    let yPos = margin;

    // Helper pour ajouter une nouvelle page si nécessaire
    const checkNewPage = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
    };

    // Helper pour tronquer le texte
    const truncateText = (text: string, maxLength: number = 60): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 1) + "…";
    };

    // ===== HEADER (sobre, aéré) =====
    try {
      const logoUrl = new URL("../../../../../public/" + LOGO_OFFICIAL_PATH.replace(/^\//, ""), import.meta.url);
      const logoPath = fileURLToPath(logoUrl);
      const logoBuffer = await readFile(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      pdf.addImage(`data:image/svg+xml;base64,${logoBase64}`, "SVG", margin, yPos, 30, 10);
    } catch (error) {
      console.warn("Logo non disponible pour l'export PDF:", error);
    }
    yPos += 12;

    // Titre principal (H1)
    pdf.setFontSize(fonts.h1);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(`Monthly Review`, margin, yPos);
    yPos += 6;

    // Période (muted)
    pdf.setFontSize(fonts.muted);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(data.period.label, margin, yPos);
    yPos += spacing.md;

    // ===== RÉSUMÉ EXÉCUTIF (compact, lisible) =====
    checkNewPage(40);
    
    // Titre de section (H2)
    pdf.setFontSize(fonts.h2);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text("Résumé exécutif", margin, yPos);
    yPos += spacing.sm;

    // Fond très léger (presque invisible)
    const summaryLines = pdf.splitTextToSize(data.summary, contentWidth - 16);
    const summaryHeight = Math.max(25, summaryLines.length * 4.5 + 12);
    pdf.setFillColor(248, 250, 252); // slate-50 très light
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, yPos, contentWidth, summaryHeight, 6, 6, "FD");

    // Texte (body)
    pdf.setFontSize(fonts.body);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(summaryLines, margin + 8, yPos + 8, { lineHeightFactor: 1.4 });
    yPos += summaryHeight + spacing.md;

    // ===== INDICATEURS CLÉS (grille 2 colonnes propre) =====
    checkNewPage(60);
    pdf.setFontSize(fonts.h2);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text("Indicateurs clés", margin, yPos);
    yPos += spacing.sm;

    // KPIs en grille 2x3 avec couleurs
    const kpis = [
      {
        label: "Réunions",
        value: data.kpis.meetings,
        bgColor: [227, 242, 253], // blue-50
        textColor: [25, 118, 210], // blue-600
      },
      {
        label: "Actions totales",
        value: data.kpis.actionsTotal,
        bgColor: [245, 245, 245], // gray-100
        textColor: [15, 23, 42], // slate-900
      },
      {
        label: "Actions terminées",
        value: data.kpis.actionsDone,
        bgColor: [232, 245, 233], // emerald-50
        textColor: [34, 197, 94], // emerald-500
      },
      {
        label: "Actions en retard",
        value: data.kpis.actionsOverdue,
        bgColor: [255, 235, 238], // red-50
        textColor: [239, 68, 68], // red-500
      },
      {
        label: "Décisions",
        value: data.kpis.decisions,
        bgColor: [232, 234, 246], // indigo-50
        textColor: [99, 102, 241], // indigo-500
      },
      {
        label: "Taux de complétion",
        value: `${data.kpis.completionRate}%`,
        bgColor: [245, 245, 245], // gray-100
        textColor: [15, 23, 42], // slate-900
      },
    ];

    // Grille 2 colonnes (3 lignes)
    const cardWidth = (contentWidth - spacing.sm) / 2;
    const cardHeight = 22; // Hauteur uniforme
    let cardX = margin;
    let cardY = yPos;

    kpis.forEach((kpi, index) => {
      if (index > 0 && index % 2 === 0) {
        cardX = margin;
        cardY += cardHeight + spacing.xs;
        checkNewPage(cardHeight + spacing.xs);
      }

      // Carte discrète (border très light ou none)
      pdf.setFillColor(255, 255, 255); // blanc pur
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 8, 8, "FD");

      // Valeur dominante (grande, en haut)
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
      pdf.text(String(kpi.value), cardX + 8, cardY + 10);

      // Label secondaire (petit, en bas)
      pdf.setFontSize(fonts.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      pdf.text(kpi.label, cardX + 8, cardY + 18);

      cardX += cardWidth + spacing.sm;
    });

    yPos = cardY + cardHeight + spacing.lg;

    // ===== ANALYSE VISUELLE (1 grand + 2 colonnes) =====
    if (charts.activity || charts.status || charts.projects) {
      checkNewPage(100);
      
      // Titre de section (H2)
      pdf.setFontSize(fonts.h2);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text("Analyse visuelle", margin, yPos);
      yPos += spacing.sm;

      // Graphique activité (pleine largeur, grand)
      if (charts.activity && charts.activity.length > 0) {
        try {
          checkNewPage(80);
          
          // Sous-titre (muted, petit)
          pdf.setFontSize(fonts.muted);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
          pdf.text("Activité par semaine", margin, yPos);
          yPos += spacing.xs;

          // Graphique sans bordure (image directe, plus grande)
          const chartHeight = 75; // Plus grand
          const activityBase64 = charts.activity.toString("base64");
          const activityDataUri = `data:image/png;base64,${activityBase64}`;
          console.log(`[monthly-pdf] Adding activity chart (PNG): ${activityBase64.length} chars base64`);
          pdf.addImage(activityDataUri, "PNG", margin, yPos, contentWidth, chartHeight);
          yPos += chartHeight + spacing.md;
          console.log("[monthly-pdf] Activity chart added successfully");
        } catch (error) {
          console.error("[monthly-pdf] Error adding activity chart:", error);
          pdf.setFontSize(fonts.muted);
          pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
          pdf.text("Graphique activité non disponible", margin, yPos);
          yPos += spacing.md;
        }
      } else {
        console.warn("[monthly-pdf] Activity chart buffer is null or empty");
      }

      // Graphiques status et projets (2 colonnes, même hauteur)
      if (charts.status || charts.projects) {
        checkNewPage(85);
        const chartWidth = (contentWidth - spacing.sm) / 2;
        const chartHeight = 75; // Plus grand, même hauteur

        if (charts.status && charts.status.length > 0) {
          try {
            // Sous-titre (muted)
            pdf.setFontSize(fonts.muted);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            pdf.text("Répartition des actions", margin, yPos);
            
            // Graphique sans bordure (image directe)
            const statusBase64 = charts.status.toString("base64");
            const statusDataUri = `data:image/png;base64,${statusBase64}`;
            console.log(`[monthly-pdf] Adding status chart (PNG): ${statusBase64.length} chars base64`);
            pdf.addImage(statusDataUri, "PNG", margin, yPos + spacing.xs, chartWidth, chartHeight);
            console.log("[monthly-pdf] Status chart added successfully");
          } catch (error) {
            console.error("[monthly-pdf] Error adding status chart:", error);
            pdf.setFontSize(fonts.muted);
            pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            pdf.text("Graphique répartition non disponible", margin, yPos);
          }
        } else {
          console.warn("[monthly-pdf] Status chart buffer is null or empty");
        }

        if (charts.projects && charts.projects.length > 0) {
          try {
            // Sous-titre (muted)
            pdf.setFontSize(fonts.muted);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            pdf.text("Avancement des projets", margin + chartWidth + spacing.sm, yPos);
            
            // Graphique sans bordure (image directe)
            const projectsBase64 = charts.projects.toString("base64");
            const projectsDataUri = `data:image/png;base64,${projectsBase64}`;
            console.log(`[monthly-pdf] Adding projects chart (PNG): ${projectsBase64.length} chars base64`);
            pdf.addImage(
              projectsDataUri,
              "PNG",
              margin + chartWidth + spacing.sm,
              yPos + spacing.xs,
              chartWidth,
              chartHeight
            );
            console.log("[monthly-pdf] Projects chart added successfully");
          } catch (error) {
            console.error("[monthly-pdf] Error adding projects chart:", error);
            pdf.setFontSize(fonts.muted);
            pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            pdf.text("Graphique projets non disponible", margin + chartWidth + spacing.sm, yPos);
          }
        } else {
          console.warn("[monthly-pdf] Projects chart buffer is null or empty");
        }

        yPos += chartHeight + spacing.lg;
      }
    }

    // ===== DÉCISIONS CLÉS (liste compacte, lisible) =====
    if (data.highlights.keyDecisions.length > 0) {
      checkNewPage(40);
      
      // Titre de section (H2)
      pdf.setFontSize(fonts.h2);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text("Décisions clés", margin, yPos);
      yPos += spacing.sm;

      data.highlights.keyDecisions.slice(0, 10).forEach((decision) => {
        checkNewPage(12);
        
        // Liste compacte (pas de carte, juste séparation légère)
        pdf.setFontSize(fonts.body);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        const title = truncateText(decision.title, 90);
        pdf.text(`• ${title}`, margin, yPos);
        yPos += 4;

        // Métadonnées (muted, sur même ligne si possible)
        pdf.setFontSize(fonts.muted);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        const meta = [decision.projectName, decision.date].filter(Boolean).join(" • ");
        if (meta) {
          pdf.text(meta, margin + 6, yPos);
        }
        yPos += spacing.sm;
      });
    }

    // ===== FOCUS MOIS SUIVANT (liste compacte, lisible) =====
    if (data.highlights.nextMonthFocus.length > 0) {
      checkNewPage(40);
      
      // Titre de section (H2)
      pdf.setFontSize(fonts.h2);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text("Focus mois suivant", margin, yPos);
      yPos += spacing.sm;

      data.highlights.nextMonthFocus.slice(0, 10).forEach((item) => {
        checkNewPage(12);
        
        // Liste compacte (pas de carte, juste séparation légère)
        pdf.setFontSize(fonts.body);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        const title = truncateText(item.title, 90);
        pdf.text(`• ${title}`, margin, yPos);
        yPos += 4;

        // Métadonnées (muted, sur même ligne si possible)
        pdf.setFontSize(fonts.muted);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        const meta = [item.projectName, item.dueDate].filter(Boolean).join(" • ");
        if (meta) {
          pdf.text(meta, margin + 6, yPos);
        }
        yPos += spacing.sm;
      });
    }

    // ===== FOOTER (discrèt) =====
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Divider très fin
      pdf.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
      pdf.setLineWidth(0.1);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      
      // Numéro de page (muted, petit)
      pdf.setFontSize(fonts.muted - 1);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      pdf.text(`PILOTYS — Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    // Générer le buffer PDF
    const buffer = Buffer.from(pdf.output("arraybuffer"));

    // Retourner le fichier avec les bons headers
    const filename = `monthly-review-${year}-${String(month).padStart(2, "0")}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[monthly-pdf] Failed:", error);
    if (error instanceof Error) {
      console.error("[monthly-pdf] Stack:", error.stack);
    }

    // TOUJOURS retourner JSON en cas d'erreur (jamais HTML)
    const isDev = process.env.NODE_ENV === "development";
    return new NextResponse(
      JSON.stringify({
        error: "Erreur lors de la génération du fichier PDF",
        ...(isDev && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

