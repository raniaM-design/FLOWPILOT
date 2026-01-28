/**
 * Génération de graphiques PNG pour l'export Monthly Review
 * Utilise Chart.js + chartjs-node-canvas pour générer des images avec les mêmes couleurs que l'UI
 */

import "server-only";
import type { MonthlyReviewExportData } from "./types";

// Couleurs identiques à celles utilisées dans les composants Recharts
const COLORS = {
  // Weekly Activity Chart
  meetings: "#3B82F6", // blue-500
  actions: "#22C55E", // emerald-500 (green-500)
  decisions: "#8B5CF6", // purple-500
  
  // Action Status Chart
  TODO: "#3B82F6", // blue-500
  DOING: "#8B5CF6", // purple-500
  DONE: "#22C55E", // emerald-500
  BLOCKED: "#F59E0B", // amber-500
  
  // Project Progress Chart
  on_track: "#22C55E", // emerald-500
  at_risk: "#F59E0B", // amber-500
  blocked: "#EF4444", // red-500
  
  // Text colors
  text: "#363636",
  textMuted: "#64748B", // slate-500
  grid: "#E2E8F0", // slate-200
};

// Lazy load ChartJSNodeCanvas pour éviter les problèmes Turbopack
let ChartJSNodeCanvasClass: any = null;

function getChartJSNodeCanvas() {
  if (!ChartJSNodeCanvasClass) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
      ChartJSNodeCanvasClass = ChartJSNodeCanvas;
      console.log("[generate-charts] ChartJSNodeCanvas loaded successfully");
    } catch (error) {
      console.error("[generate-charts] Failed to load ChartJSNodeCanvas:", error);
      throw error;
    }
  }
  return ChartJSNodeCanvasClass;
}

/**
 * Génère un graphique d'activité par semaine (Line Chart)
 */
export async function generateActivityChartPNG(
  data: MonthlyReviewExportData["charts"]["activityByWeek"]
): Promise<Buffer | null> {
  try {
    console.log("[generate-charts] Generating activity chart with data:", data);
    if (data.length === 0) {
      console.warn("[generate-charts] Activity chart: no data, returning null");
      return null;
    }

    const ChartJSNodeCanvas = getChartJSNodeCanvas();
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 1000, // Plus large pour meilleure qualité
      height: 500, // Plus haut pour meilleure visibilité
      backgroundColour: "white",
    });

    const labels = data.map((d) => d.weekLabel);
    const maxValue = Math.max(
      ...data.flatMap((d) => [d.meetings, d.actions, d.decisions]),
      1
    );

    const config = {
      type: "line" as const,
      data: {
        labels,
        datasets: [
          {
            label: "Réunions",
            data: data.map((d) => d.meetings),
            borderColor: COLORS.meetings,
            backgroundColor: COLORS.meetings,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Actions créées",
            data: data.map((d) => d.actions),
            borderColor: COLORS.actions,
            backgroundColor: COLORS.actions,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Décisions prises",
            data: data.map((d) => d.decisions),
            borderColor: COLORS.decisions,
            backgroundColor: COLORS.decisions,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: "top" as const,
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 14,
                family: "Arial",
                weight: "500",
              },
              color: COLORS.text,
            },
          },
          title: {
            display: true,
            text: "Activité par semaine",
            font: {
              size: 18,
              weight: "bold",
              family: "Arial",
            },
            color: COLORS.text,
            padding: {
              top: 10,
              bottom: 20,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: COLORS.grid,
              lineWidth: 1,
              drawBorder: false,
            },
            ticks: {
              color: COLORS.textMuted,
              font: {
                size: 13,
                family: "Arial",
                weight: "500",
              },
            },
          },
          y: {
            beginAtZero: true,
            max: Math.ceil(maxValue * 1.1),
            grid: {
              display: true,
              color: COLORS.grid,
              lineWidth: 1,
              drawBorder: false,
            },
            ticks: {
              color: COLORS.textMuted,
              font: {
                size: 13,
                family: "Arial",
                weight: "500",
              },
            },
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config, "image/png");
    console.log(`[generate-charts] Activity chart generated: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("[generate-charts] Erreur génération activity chart:", error);
    if (error instanceof Error) {
      console.error("[generate-charts] Error details:", error.message, error.stack);
    }
    return null;
  }
}

/**
 * Génère un graphique de répartition des actions (Pie Chart)
 */
export async function generateActionStatusChartPNG(
  data: MonthlyReviewExportData["charts"]["actionStatus"]
): Promise<Buffer | null> {
  try {
    console.log("[generate-charts] Generating action status chart with data:", data);
    if (data.length === 0 || data.reduce((sum, d) => sum + d.value, 0) === 0) {
      console.warn("[generate-charts] Action status chart: no data or all zeros, returning null");
      return null;
    }

    const ChartJSNodeCanvas = getChartJSNodeCanvas();
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 700, // Plus large pour meilleure qualité
      height: 500, // Plus haut pour meilleure visibilité
      backgroundColour: "white",
    });

    const statusColorMap: Record<string, string> = {
      todo: COLORS.TODO,
      in_progress: COLORS.DOING,
      done: COLORS.DONE,
      blocked: COLORS.BLOCKED,
    };

    const config = {
      type: "pie" as const,
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: data.map((d) => statusColorMap[d.status] || COLORS.textMuted),
            borderWidth: 2,
            borderColor: "white",
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: "right" as const,
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 14,
                family: "Arial",
                weight: "500",
              },
              color: COLORS.text,
            },
          },
          title: {
            display: true,
            text: "Répartition des actions",
            font: {
              size: 18,
              weight: "bold",
              family: "Arial",
            },
            color: COLORS.text,
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config, "image/png");
    console.log(`[generate-charts] Action status chart generated: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("[generate-charts] Erreur génération action status chart:", error);
    if (error instanceof Error) {
      console.error("[generate-charts] Error details:", error.message, error.stack);
    }
    return null;
  }
}

/**
 * Génère un graphique d'avancement des projets (Horizontal Bar Chart)
 */
export async function generateProjectProgressChartPNG(
  data: MonthlyReviewExportData["charts"]["projectProgress"]
): Promise<Buffer | null> {
  try {
    console.log("[generate-charts] Generating project progress chart with data:", data);
    if (data.length === 0) {
      console.warn("[generate-charts] Project progress chart: no data, returning null");
      return null;
    }

    const ChartJSNodeCanvas = getChartJSNodeCanvas();
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 1000, // Plus large pour meilleure qualité
      height: Math.max(500, data.length * 60 + 120), // Plus haut pour meilleure visibilité
      backgroundColour: "white",
    });

    // Limiter à 10 projets pour la lisibilité
    const displayData = data.slice(0, 10);

    const config = {
      type: "bar" as const,
      data: {
        labels: displayData.map((p) => (p.name.length > 25 ? p.name.substring(0, 25) + "..." : p.name)),
        datasets: [
          {
            label: "Avancement (%)",
            data: displayData.map((p) => p.completionRate),
            backgroundColor: displayData.map((p) => {
              switch (p.status) {
                case "on_track":
                  return COLORS.on_track;
                case "at_risk":
                  return COLORS.at_risk;
                case "blocked":
                  return COLORS.blocked;
                default:
                  return COLORS.textMuted;
              }
            }),
            borderColor: displayData.map((p) => {
              switch (p.status) {
                case "on_track":
                  return COLORS.on_track;
                case "at_risk":
                  return COLORS.at_risk;
                case "blocked":
                  return COLORS.blocked;
                default:
                  return COLORS.textMuted;
              }
            }),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y" as const,
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const project = displayData[context.dataIndex];
                return `${project.name}: ${context.parsed.x}%`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: {
              display: true,
              color: COLORS.grid,
              lineWidth: 1,
              drawBorder: false,
            },
            ticks: {
              color: COLORS.textMuted,
              font: {
                size: 13,
                family: "Arial",
                weight: "500",
              },
              callback: (value: any) => `${value}%`,
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: COLORS.textMuted,
              font: {
                size: 13,
                family: "Arial",
                weight: "500",
              },
            },
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config, "image/png");
    console.log(`[generate-charts] Project progress chart generated: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("[generate-charts] Erreur génération project progress chart:", error);
    if (error instanceof Error) {
      console.error("[generate-charts] Error details:", error.message, error.stack);
    }
    return null;
  }
}

/**
 * Génère tous les graphiques pour l'export
 */
export async function generateAllChartsPNG(
  data: MonthlyReviewExportData
): Promise<{
  activity: Buffer | null;
  status: Buffer | null;
  projects: Buffer | null;
}> {
  const [activity, status, projects] = await Promise.all([
    generateActivityChartPNG(data.charts.activityByWeek),
    generateActionStatusChartPNG(data.charts.actionStatus),
    generateProjectProgressChartPNG(data.charts.projectProgress),
  ]);

  return {
    activity,
    status,
    projects,
  };
}


