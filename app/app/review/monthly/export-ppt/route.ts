import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { buildMonthlyReviewData } from "@/lib/review/monthly/buildMonthlyReviewData";
import { generateAllChartsPNG } from "@/lib/review/monthly/generate-charts";
import { generateAllChartsSVG } from "@/lib/review/monthly/generate-charts-svg";
import { generateMonthlyReviewPpt } from "@/lib/export/monthly/ppt-generator";

/**
 * Route Handler pour exporter la Monthly Review en PPTX
 * POST /app/review/monthly/export-ppt
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    // Dates pour le mois courant
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const locale = "fr"; // TODO: récupérer depuis les headers ou query params

    // Récupérer l'email de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const userName = user?.email || "Utilisateur";

    // Construire les données de la monthly review
    const data = await buildMonthlyReviewData({
      year,
      month,
      locale,
      userId,
    });

    // Ajouter le nom d'utilisateur aux données
    const dataWithUser = { ...data, userName };

    // Générer les graphiques - Essayer d'abord Chart.js, puis fallback SVG
    let charts = await generateAllChartsPNG(data);
    
    // Si Chart.js n'a pas fonctionné, utiliser SVG
    if (!charts.activity || charts.activity.length === 0) {
      console.log("[monthly-ppt] Chart.js failed, using SVG fallback");
      charts = await generateAllChartsSVG(data);
    }
    
    // Log pour déboguer
    console.log("[monthly-ppt] Charts generated:", {
      activity: charts.activity ? `${charts.activity.length} bytes` : "null",
      status: charts.status ? `${charts.status.length} bytes` : "null",
      projects: charts.projects ? `${charts.projects.length} bytes` : "null",
    });

    // Générer le PPT avec le générateur dédié
    const buffer = await generateMonthlyReviewPpt(dataWithUser, charts);

    // Retourner le fichier avec les bons headers
    const filename = `monthly-review-${year}-${String(month).padStart(2, "0")}.pptx`;
    
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
    console.error("[monthly-ppt] Failed:", error);
    if (error instanceof Error) {
      console.error("[monthly-ppt] Stack:", error.stack);
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

