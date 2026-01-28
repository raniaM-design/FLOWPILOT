import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { isOverdue, formatShortDate } from "@/lib/timeUrgency";
import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";

// Forcer le runtime Node.js pour accéder au filesystem
export const runtime = "nodejs";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Route Handler pour exporter la Weekly Review en PPTX
 * POST /app/review/weekly/export-ppt
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    // Dates pour la semaine
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1) Décisions à surveiller (risk RED, max 5)
    const allDecisions = await prisma.decision.findMany({
      where: {
        project: {
          ownerId: userId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        actions: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type DecisionWithActions = {
      id: string;
      title: string;
      project: { id: string; name: string };
      actions: Array<{ id: string; status: string; dueDate: Date | null }>;
    };

    type DecisionWithRisk = DecisionWithActions & {
      risk: { level: string; label: string };
    };

    const riskyDecisions = allDecisions
      .map((decision: DecisionWithActions): DecisionWithRisk => {
        const risk = calculateDecisionRisk(decision.actions);
        return {
          ...decision,
          risk,
        };
      })
      .filter((decision: DecisionWithRisk) => decision.risk.level === "RED")
      .slice(0, 5);

    // 2) Actions bloquées (status BLOCKED, max 8)
    const blockedActions = await prisma.actionItem.findMany({
      where: {
        assigneeId: userId,
        status: "BLOCKED",
        project: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        decision: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    // 3) Actions en retard (overdue, max 8)
    const allActions = await prisma.actionItem.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: "DONE",
        },
        project: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        decision: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    type ActionItem = {
      id: string;
      title: string;
      status: string;
      dueDate: Date | null;
      project: { id: string; name: string };
      decision: { id: string; title: string } | null;
    };

    const overdueActions = allActions
      .filter((action: ActionItem) => isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now))
      .slice(0, 8);

    // 4) Décisions prises cette semaine (DECIDED, createdAt within last 7 days, max 5)
    const recentDecisions = await prisma.decision.findMany({
      where: {
        createdById: userId,
        status: "DECIDED",
        createdAt: {
          gte: sevenDaysAgo,
        },
        project: {
          ownerId: userId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        actions: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Créer la présentation PPTX
    const pptx = new PptxGenJS();
    
    // Configuration de la slide
    const slide = pptx.addSlide();
    
    // Logo PILOTYS - Fichier officiel unique, identique partout
    try {
      // Utiliser le chemin officiel depuis la config centralisée
      const logoPath = join(__dirname, "../../../../../public", LOGO_OFFICIAL_PATH.replace(/^\//, ""));
      const logoBuffer = await readFile(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      
      // Calculer les dimensions en respectant le ratio officiel
      const logoHeight = 0.6; // Hauteur en pouces
      const logoWidth = logoHeight * LOGO_OFFICIAL_DIMENSIONS.ratio;
      
      slide.addImage({
        data: `data:image/svg+xml;base64,${logoBase64}`,
        x: 0.5,
        y: 0.2,
        w: logoWidth,
        h: logoHeight,
      });
    } catch (error) {
      // Fallback silencieux si le logo n'est pas disponible
      console.warn("Logo non disponible pour l'export PPT:", error);
    }
    
    // Titre principal
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    
    slide.addText(`Weekly Review — ${dateStr}`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: "363636",
      fontFace: "Arial",
    });

    // Helper pour tronquer le texte
    const truncateText = (text: string, maxLength: number = 60): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 1) + "…";
    };

    // Helper pour formater une liste d'items
    const formatList = (items: Array<{ title: string; [key: string]: any }>, maxItems: number): string => {
      if (items.length === 0) {
        return "Aucun élément";
      }
      return items
        .slice(0, maxItems)
        .map((item) => `• ${truncateText(item.title)}`)
        .join("\n");
    };

    // Bloc 1: Décisions à surveiller
    const riskyText = riskyDecisions.length > 0
      ? riskyDecisions
          .map((decision: DecisionWithRisk) => `• ${truncateText(decision.title)} (${decision.project.name})`)
          .join("\n")
      : "Aucune décision critique";

    slide.addText("Décisions à surveiller", {
      x: 0.5,
      y: 1.5,
      w: 4.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "D32F2F",
      fontFace: "Arial",
    });

    slide.addText(riskyText, {
      x: 0.5,
      y: 2.1,
      w: 4.5,
      h: 2.2,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });

    // Bloc 2: Actions bloquées
    const blockedText = blockedActions.length > 0
      ? blockedActions
          .map((action: ActionItem) => {
            const projectInfo = action.decision
              ? `${action.project.name} • ${truncateText(action.decision.title, 30)}`
              : action.project.name;
            return `• ${truncateText(action.title)} (${projectInfo})`;
          })
          .join("\n")
      : "Aucune action bloquée";

    slide.addText("Actions bloquées", {
      x: 5.5,
      y: 1.5,
      w: 4.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "FF9800",
      fontFace: "Arial",
    });

    slide.addText(blockedText, {
      x: 5.5,
      y: 2.1,
      w: 4.5,
      h: 2.2,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });

    // Bloc 3: Actions en retard
    const overdueText = overdueActions.length > 0
      ? overdueActions
          .map((action: ActionItem) => {
            const dueDateStr = action.dueDate ? formatShortDate(action.dueDate) : "Sans échéance";
            const projectInfo = action.decision
              ? `${action.project.name} • ${truncateText(action.decision.title, 25)}`
              : action.project.name;
            return `• ${truncateText(action.title)} (${projectInfo}) — ${dueDateStr}`;
          })
          .join("\n")
      : "Aucune action en retard";

    slide.addText("Actions en retard", {
      x: 0.5,
      y: 4.5,
      w: 4.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "D32F2F",
      fontFace: "Arial",
    });

    slide.addText(overdueText, {
      x: 0.5,
      y: 5.1,
      w: 4.5,
      h: 2.2,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });

    // Bloc 4: Décisions prises cette semaine
    type RecentDecision = {
      id: string;
      title: string;
      createdAt: Date;
      project: { id: string; name: string };
      actions: Array<{ id: string; status: string; dueDate: Date | null }>;
    };

    const recentText = recentDecisions.length > 0
      ? recentDecisions
          .map((decision: RecentDecision) => {
            const risk = calculateDecisionRisk(decision.actions);
            const dateStr = new Date(decision.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            });
            return `• ${truncateText(decision.title)} (${decision.project.name}) — ${dateStr}`;
          })
          .join("\n")
      : "Aucune décision prise cette semaine";

    slide.addText("Décisions prises cette semaine", {
      x: 5.5,
      y: 4.5,
      w: 4.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "2196F3",
      fontFace: "Arial",
    });

    slide.addText(recentText, {
      x: 5.5,
      y: 5.1,
      w: 4.5,
      h: 2.2,
      fontSize: 12,
      color: "363636",
      fontFace: "Arial",
      valign: "top",
    });

    // Générer le buffer PPTX
    const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;

    // Retourner le fichier avec les bons headers
    const filename = `weekly-review-${new Date().toISOString().split("T")[0]}.pptx`;
    
    // Convertir Buffer en Uint8Array pour NextResponse
    const uint8Array = new Uint8Array(buffer);
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[weekly-ppt] Failed:", error);
    if (error instanceof Error) {
      console.error("[weekly-ppt] Stack:", error.stack);
    }
    
    // TOUJOURS retourner JSON en cas d'erreur (jamais HTML)
    const isDev = process.env.NODE_ENV === "development";
    return new NextResponse(
      JSON.stringify({
        error: "Erreur lors de la génération du fichier PPTX",
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

