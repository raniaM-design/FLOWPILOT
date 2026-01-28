/**
 * Génération de graphiques pour l'export Monthly Review
 * Génère des SVG simples pour les graphiques (alternative à recharts côté serveur)
 */

import type { MonthlyReviewExportData } from "./types";

/**
 * Génère un SVG pour le graphique d'activité par semaine (Line Chart)
 */
function generateActivityChartSVG(data: MonthlyReviewExportData["charts"]["activityByWeek"]): string {
  if (data.length === 0) {
    return `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <text x="400" y="200" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Trouver les valeurs max pour l'échelle
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.meetings, d.actions, d.decisions]),
    1
  );
  const yScale = chartHeight / maxValue;

  // Points pour chaque ligne
  const points = {
    meetings: data.map((d, i) => ({
      x: padding.left + (i * chartWidth) / (data.length - 1 || 1),
      y: padding.top + chartHeight - d.meetings * yScale,
    })),
    actions: data.map((d, i) => ({
      x: padding.left + (i * chartWidth) / (data.length - 1 || 1),
      y: padding.top + chartHeight - d.actions * yScale,
    })),
    decisions: data.map((d, i) => ({
      x: padding.left + (i * chartWidth) / (data.length - 1 || 1),
      y: padding.top + chartHeight - d.decisions * yScale,
    })),
  };

  // Créer les paths pour les lignes
  const createPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return "";
    return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  };

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Grille -->
    ${Array.from({ length: 5 }, (_, i) => {
      const y = padding.top + (chartHeight / 4) * i;
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3"/>`;
    }).join("")}
    
    <!-- Axes -->
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#64748B" stroke-width="2"/>
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#64748B" stroke-width="2"/>
    
    <!-- Lignes -->
    <path d="${createPath(points.meetings)}" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
    <path d="${createPath(points.actions)}" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round"/>
    <path d="${createPath(points.decisions)}" fill="none" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Points -->
    ${points.meetings.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#3B82F6"/>`).join("")}
    ${points.actions.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#22C55E"/>`).join("")}
    ${points.decisions.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#8B5CF6"/>`).join("")}
    
    <!-- Labels X -->
    ${data.map((d, i) => {
      const x = padding.left + (i * chartWidth) / (data.length - 1 || 1);
      return `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748B">${d.weekLabel}</text>`;
    }).join("")}
    
    <!-- Labels Y -->
    ${Array.from({ length: 5 }, (_, i) => {
      const value = Math.round((maxValue / 4) * (4 - i));
      const y = padding.top + (chartHeight / 4) * i;
      return `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-family="Arial" font-size="12" fill="#64748B">${value}</text>`;
    }).join("")}
    
    <!-- Légende -->
    <g transform="translate(${width - 200}, ${padding.top})">
      <circle cx="5" cy="5" r="4" fill="#3B82F6"/>
      <text x="15" y="8" font-family="Arial" font-size="12" fill="#363636">Réunions</text>
      <circle cx="5" cy="25" r="4" fill="#22C55E"/>
      <text x="15" y="28" font-family="Arial" font-size="12" fill="#363636">Actions</text>
      <circle cx="5" cy="45" r="4" fill="#8B5CF6"/>
      <text x="15" y="48" font-family="Arial" font-size="12" fill="#363636">Décisions</text>
    </g>
  </svg>`;
}

/**
 * Génère un SVG pour le graphique de répartition des actions (Pie Chart)
 */
function generateActionStatusChartSVG(data: MonthlyReviewExportData["charts"]["actionStatus"]): string {
  if (data.length === 0) {
    return `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="200" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 120;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${centerX}" y="${centerY}" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const colors: Record<string, string> = {
    done: "#22C55E",
    in_progress: "#8B5CF6",
    blocked: "#F59E0B",
    overdue: "#EF4444",
    todo: "#3B82F6",
  };

  let currentAngle = -Math.PI / 2; // Commencer en haut

  const paths = data.map((item) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return {
      path,
      color: colors[item.status] || "#94A3B8",
      label: item.label,
      percentage: item.percentage,
    };
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Secteurs -->
    ${paths.map((p, i) => `<path d="${p.path}" fill="${p.color}" stroke="#fff" stroke-width="2"/>`).join("")}
    
    <!-- Légende -->
    <g transform="translate(${centerX + radius + 40}, ${centerY - (paths.length * 30) / 2})">
      ${paths.map((p, i) => `
        <rect x="0" y="${i * 30}" width="16" height="16" fill="${p.color}"/>
        <text x="22" y="${i * 30 + 12}" font-family="Arial" font-size="12" fill="#363636">${p.label}: ${p.percentage}%</text>
      `).join("")}
    </g>
  </svg>`;
}

/**
 * Génère un SVG pour le graphique d'avancement des projets (Bar Chart horizontal)
 */
function generateProjectProgressChartSVG(data: MonthlyReviewExportData["charts"]["projectProgress"]): string {
  if (data.length === 0) {
    return `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <text x="400" y="200" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const width = 800;
  const height = Math.max(400, data.length * 50 + 100);
  const padding = { top: 40, right: 40, bottom: 40, left: 200 };
  const chartWidth = width - padding.left - padding.right;
  const barHeight = Math.min(30, (height - padding.top - padding.bottom) / data.length - 10);

  const colors: Record<string, string> = {
    on_track: "#22C55E",
    at_risk: "#F59E0B",
    blocked: "#EF4444",
  };

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Grille -->
    ${Array.from({ length: 5 }, (_, i) => {
      const x = padding.left + (chartWidth / 4) * i;
      return `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3"/>`;
    }).join("")}
    
    <!-- Axes -->
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#64748B" stroke-width="2"/>
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#64748B" stroke-width="2"/>
    
    <!-- Barres -->
    ${data.map((project, i) => {
      const y = padding.top + i * (barHeight + 10);
      const barWidth = (project.completionRate / 100) * chartWidth;
      const color = colors[project.status] || "#94A3B8";
      const displayName = project.name.length > 25 ? project.name.substring(0, 25) + "..." : project.name;
      
      return `
        <!-- Barre -->
        <rect x="${padding.left}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
        <!-- Label projet -->
        <text x="${padding.left - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-family="Arial" font-size="11" fill="#363636">${displayName}</text>
        <!-- Pourcentage -->
        <text x="${padding.left + barWidth + 5}" y="${y + barHeight / 2 + 4}" font-family="Arial" font-size="11" fill="#363636" font-weight="bold">${project.completionRate}%</text>
      `;
    }).join("")}
    
    <!-- Labels X -->
    ${Array.from({ length: 5 }, (_, i) => {
      const value = i * 25;
      const x = padding.left + (chartWidth / 4) * i;
      return `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748B">${value}%</text>`;
    }).join("")}
  </svg>`;
}

/**
 * Convertit un SVG en Buffer PNG (via conversion simple)
 * Pour l'instant, on retourne le SVG en base64, les librairies PDF/PPT peuvent le gérer
 */
async function svgToBuffer(svg: string): Promise<Buffer> {
  // Pour l'instant, on retourne le SVG comme buffer
  // Les librairies jsPDF et PptxGenJS peuvent gérer les SVG directement
  return Buffer.from(svg, "utf-8");
}

/**
 * Génère les images des graphiques pour l'export
 */
export async function renderMonthlyChartsImages(
  data: MonthlyReviewExportData
): Promise<{
  activity: Buffer;
  status: Buffer;
  projects: Buffer;
}> {
  const activitySVG = generateActivityChartSVG(data.charts.activityByWeek);
  const statusSVG = generateActionStatusChartSVG(data.charts.actionStatus);
  const projectsSVG = generateProjectProgressChartSVG(data.charts.projectProgress);

  return {
    activity: await svgToBuffer(activitySVG),
    status: await svgToBuffer(statusSVG),
    projects: await svgToBuffer(projectsSVG),
  };
}

