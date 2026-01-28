/**
 * Génération de graphiques SVG pour l'export Monthly Review
 * Alternative à Chart.js : génération SVG pure côté serveur
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

/**
 * Génère un graphique d'activité par semaine (Line Chart) en SVG
 */
export function generateActivityChartSVG(
  data: MonthlyReviewExportData["charts"]["activityByWeek"]
): string {
  if (data.length === 0) {
    return `<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
      <text x="500" y="250" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  // Dimensions optimisées pour PDF/PPT (éviter scaling flou)
  const width = 1400; // Plus large pour meilleure qualité
  const height = 700; // Plus haut pour meilleure visibilité
  const padding = { top: 70, right: 50, bottom: 90, left: 90 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Trouver les valeurs max pour l'échelle (arrondir à la dizaine supérieure)
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.meetings, d.actions, d.decisions]),
    1
  );
  const roundedMax = Math.ceil(maxValue / 5) * 5; // Arrondir à la dizaine supérieure
  const yScale = chartHeight / roundedMax;

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

  // Grille Y (plus subtile et professionnelle)
  const gridLines = [];
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (chartHeight * i) / ySteps;
    gridLines.push(
      `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="${COLORS.grid}" stroke-width="0.5" opacity="0.6" />`
    );
    const value = Math.round((roundedMax * (ySteps - i)) / ySteps);
    gridLines.push(
      `<text x="${padding.left - 15}" y="${y + 5}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="${COLORS.textMuted}">${value}</text>`
    );
  }

  // Grille X (verticale, plus subtile)
  data.forEach((d, i) => {
    const x = padding.left + (i * chartWidth) / (data.length - 1 || 1);
    gridLines.push(
      `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartHeight}" stroke="${COLORS.grid}" stroke-width="0.5" opacity="0.6" />`
    );
  });
  
  // Axes principaux (plus visibles)
  gridLines.push(
    `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="${COLORS.textMuted}" stroke-width="2" />`,
    `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" stroke="${COLORS.textMuted}" stroke-width="2" />`
  );

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Fond avec dégradé subtil -->
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    
    ${gridLines.join("\n    ")}
    
    <!-- Ligne Réunions avec ombre et remplissage -->
    <defs>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
      </filter>
    </defs>
    <path d="${createPath(points.meetings)}" stroke="${COLORS.meetings}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />
    ${points.meetings.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="6" fill="white" stroke="${COLORS.meetings}" stroke-width="3" filter="url(#shadow)" />`).join("\n    ")}
    
    <!-- Ligne Actions créées -->
    <path d="${createPath(points.actions)}" stroke="${COLORS.actions}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />
    ${points.actions.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="6" fill="white" stroke="${COLORS.actions}" stroke-width="3" filter="url(#shadow)" />`).join("\n    ")}
    
    <!-- Ligne Décisions prises -->
    <path d="${createPath(points.decisions)}" stroke="${COLORS.decisions}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />
    ${points.decisions.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="6" fill="white" stroke="${COLORS.decisions}" stroke-width="3" filter="url(#shadow)" />`).join("\n    ")}
    
    <!-- Labels X (plus grands et lisibles) -->
    ${data.map((d, i) => {
      const x = padding.left + (i * chartWidth) / (data.length - 1 || 1);
      return `<text x="${x}" y="${height - padding.bottom + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="${COLORS.text}">${d.weekLabel}</text>`;
    }).join("\n    ")}
    
    <!-- Titre principal (H2, discret) -->
    <text x="${width / 2}" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="${COLORS.text}">Activité par semaine</text>
    
    <!-- Légende bottom (discrète, en bas) -->
    <g transform="translate(${width / 2 - 150}, ${height - 60})">
      <line x1="0" y1="5" x2="25" y2="5" stroke="${COLORS.meetings}" stroke-width="3" stroke-linecap="round" />
      <circle cx="12.5" cy="5" r="3" fill="white" stroke="${COLORS.meetings}" stroke-width="2" />
      <text x="30" y="8" font-family="Arial, sans-serif" font-size="12" fill="${COLORS.textMuted}">Réunions</text>
      
      <line x1="100" y1="5" x2="125" y2="5" stroke="${COLORS.actions}" stroke-width="3" stroke-linecap="round" />
      <circle cx="112.5" cy="5" r="3" fill="white" stroke="${COLORS.actions}" stroke-width="2" />
      <text x="130" y="8" font-family="Arial, sans-serif" font-size="12" fill="${COLORS.textMuted}">Actions créées</text>
      
      <line x1="200" y1="5" x2="225" y2="5" stroke="${COLORS.decisions}" stroke-width="3" stroke-linecap="round" />
      <circle cx="212.5" cy="5" r="3" fill="white" stroke="${COLORS.decisions}" stroke-width="2" />
      <text x="230" y="8" font-family="Arial, sans-serif" font-size="12" fill="${COLORS.textMuted}">Décisions prises</text>
    </g>
  </svg>`;
}

/**
 * Génère un graphique de répartition des actions (Pie Chart) en SVG
 */
export function generateActionStatusChartSVG(
  data: MonthlyReviewExportData["charts"]["actionStatus"]
): string {
  if (data.length === 0 || data.reduce((sum, d) => sum + d.value, 0) === 0) {
    return `<svg width="700" height="500" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="250" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const width = 700;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 150;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90; // Commencer en haut

  const statusColorMap: Record<string, string> = {
    todo: COLORS.TODO,
    in_progress: COLORS.DOING,
    done: COLORS.DONE,
    blocked: COLORS.BLOCKED,
  };

  const slices = data.map((d) => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    const labelAngle = (startAngle + endAngle) / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelX = centerX + (radius + 40) * Math.cos(labelRad);
    const labelY = centerY + (radius + 40) * Math.sin(labelRad);
    
    currentAngle = endAngle;
    
    return {
      path,
      color: statusColorMap[d.status] || COLORS.textMuted,
      label: d.label,
      percentage: percentage.toFixed(0),
      labelX,
      labelY,
    };
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradientPie" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
      </linearGradient>
      <filter id="shadowPie">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGradientPie)" />
    
    <!-- Titre principal (H2, discret) -->
    <text x="${centerX}" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="${COLORS.text}">Répartition des actions</text>
    
    <!-- Tranches du graphique avec ombre -->
    ${slices.map((slice, i) => `
      <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="3" filter="url(#shadowPie)" />
      <text x="${slice.labelX}" y="${slice.labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" stroke="${COLORS.text}" stroke-width="0.5">${slice.percentage}%</text>
    `).join("\n    ")}
    
    <!-- Légende bottom (discrète, en bas) -->
    <g transform="translate(${centerX - 120}, ${height - 80})">
      ${slices.map((slice, i) => `
        <rect x="${(i % 3) * 140}" y="${Math.floor(i / 3) * 30}" width="16" height="16" fill="${slice.color}" stroke="white" stroke-width="1" rx="2" />
        <text x="${(i % 3) * 140 + 22}" y="${Math.floor(i / 3) * 30 + 12}" font-family="Arial, sans-serif" font-size="12" fill="${COLORS.textMuted}">${slice.label} ${slice.percentage}%</text>
      `).join("\n      ")}
    </g>
  </svg>`;
}

/**
 * Génère un graphique d'avancement des projets (Horizontal Bar Chart) en SVG
 */
export function generateProjectProgressChartSVG(
  data: MonthlyReviewExportData["charts"]["projectProgress"]
): string {
  if (data.length === 0) {
    return `<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
      <text x="500" y="250" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748B">Aucune donnée</text>
    </svg>`;
  }

  const width = 1000;
  const barHeight = 40;
  const spacing = 10;
  const padding = { top: 60, right: 100, bottom: 40, left: 200 };
  const chartWidth = width - padding.left - padding.right;
  const maxHeight = Math.max(500, data.length * (barHeight + spacing) + padding.top + padding.bottom);
  const height = maxHeight;

  // Limiter à 10 projets
  const displayData = data.slice(0, 10);

  const bars = displayData.map((project, i) => {
    const y = padding.top + i * (barHeight + spacing);
    const barWidth = (project.completionRate / 100) * chartWidth;
    
    const color = 
      project.status === "on_track" ? COLORS.on_track :
      project.status === "at_risk" ? COLORS.at_risk :
      COLORS.blocked;
    
    const name = project.name.length > 25 ? project.name.substring(0, 25) + "..." : project.name;
    
    return {
      y,
      barWidth,
      color,
      name,
      percentage: project.completionRate,
    };
  });

  // Grille
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const x = padding.left + (chartWidth * i) / 4;
    gridLines.push(
      `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + displayData.length * (barHeight + spacing)}" stroke="${COLORS.grid}" stroke-width="1" />`
    );
    gridLines.push(
      `<text x="${x}" y="${padding.top - 10}" text-anchor="middle" font-family="Arial" font-size="12" fill="${COLORS.textMuted}">${i * 25}%</text>`
    );
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradientProjects" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
      </linearGradient>
      <filter id="shadowBar">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGradientProjects)" />
    
    <!-- Titre principal (H2, discret) -->
    <text x="${width / 2}" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="${COLORS.text}">Avancement des projets</text>
    
    <!-- Grille (plus subtile) -->
    ${gridLines.map(line => line.replace('stroke-width="1"', 'stroke-width="0.5" opacity="0.6"')).join("\n    ")}
    
    <!-- Axes principaux -->
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="${COLORS.textMuted}" stroke-width="2" />
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${padding.left + chartWidth}" y2="${height - padding.bottom}" stroke="${COLORS.textMuted}" stroke-width="2" />
    
    <!-- Labels X (pourcentages) -->
    ${Array.from({ length: 5 }, (_, i) => {
      const value = i * 25;
      const x = padding.left + (chartWidth / 4) * i;
      return `<text x="${x}" y="${height - padding.bottom + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="${COLORS.textMuted}">${value}%</text>`
    }).join("\n    ")}
    
    <!-- Barres avec ombre et dégradé -->
    ${bars.map((bar, i) => {
      // Créer un dégradé pour chaque barre
      const gradientId = `gradient-${i}`;
      return `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${bar.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bar.color};stop-opacity:0.85" />
        </linearGradient>
      </defs>
      <rect x="${padding.left}" y="${bar.y}" width="${bar.barWidth}" height="${barHeight}" fill="url(#${gradientId})" rx="6" filter="url(#shadowBar)" />
      <text x="${padding.left - 12}" y="${bar.y + barHeight / 2 + 5}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="${COLORS.text}">${bar.name}</text>
      <text x="${padding.left + bar.barWidth + 12}" y="${bar.y + barHeight / 2 + 5}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bar.color}">${bar.percentage}%</text>
    `}).join("\n    ")}
  </svg>`;
}

/**
 * Convertit un SVG en Buffer PNG en utilisant sharp
 */
export async function svgToPNGBuffer(svg: string): Promise<Buffer> {
  try {
    // Lazy load sharp pour éviter les problèmes Turbopack
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const sharp = require("sharp");
    
    // Convertir SVG en PNG
    const pngBuffer = await sharp(Buffer.from(svg, "utf-8"))
      .png()
      .toBuffer();
    
    console.log(`[generate-charts-svg] SVG converted to PNG: ${pngBuffer.length} bytes`);
    return pngBuffer;
  } catch (error) {
    console.error("[generate-charts-svg] Error converting SVG to PNG:", error);
    // Fallback: retourner le SVG comme buffer (certaines versions de jsPDF peuvent le gérer)
    return Buffer.from(svg, "utf-8");
  }
}

/**
 * Génère tous les graphiques en SVG
 */
export async function generateAllChartsSVG(
  data: MonthlyReviewExportData
): Promise<{
  activity: Buffer | null;
  status: Buffer | null;
  projects: Buffer | null;
}> {
  try {
    const activitySVG = generateActivityChartSVG(data.charts.activityByWeek);
    const statusSVG = generateActionStatusChartSVG(data.charts.actionStatus);
    const projectsSVG = generateProjectProgressChartSVG(data.charts.projectProgress);

    return {
      activity: await svgToPNGBuffer(activitySVG),
      status: await svgToPNGBuffer(statusSVG),
      projects: await svgToPNGBuffer(projectsSVG),
    };
  } catch (error) {
    console.error("[generate-charts-svg] Error:", error);
    return {
      activity: null,
      status: null,
      projects: null,
    };
  }
}

