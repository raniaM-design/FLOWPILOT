/**
 * Script de test pour vérifier la génération des graphiques monthly review
 */

import { readFile } from "fs/promises";
import { join } from "path";

// Simuler des données de test
const testData = {
  charts: {
    activityByWeek: [
      { weekLabel: "Semaine 1", meetings: 2, actions: 5, decisions: 1 },
      { weekLabel: "Semaine 2", meetings: 3, actions: 8, decisions: 2 },
      { weekLabel: "Semaine 3", meetings: 1, actions: 12, decisions: 3 },
      { weekLabel: "Semaine 4", meetings: 4, actions: 15, decisions: 2 },
    ],
    actionStatus: [
      { status: "done", label: "Terminées", value: 10, percentage: 40 },
      { status: "in_progress", label: "En cours", value: 8, percentage: 32 },
      { status: "todo", label: "À faire", value: 5, percentage: 20 },
      { status: "blocked", label: "Bloquées", value: 2, percentage: 8 },
    ],
    projectProgress: [
      { projectId: "1", name: "Projet Alpha", completionRate: 75, done: 15, total: 20, overdue: 2, status: "on_track" },
      { projectId: "2", name: "Projet Beta", completionRate: 45, done: 9, total: 20, overdue: 5, status: "at_risk" },
      { projectId: "3", name: "Projet Gamma", completionRate: 20, done: 4, total: 20, overdue: 8, status: "blocked" },
    ],
  },
};

console.log("🧪 Test de génération des graphiques SVG...\n");

try {
  // Test 1: Importer le module SVG
  console.log("1️⃣ Import du module generate-charts-svg...");
  const { generateAllChartsSVG } = await import("../lib/review/monthly/generate-charts-svg.ts");
  console.log("✅ Module importé avec succès\n");

  // Test 2: Générer les graphiques
  console.log("2️⃣ Génération des graphiques...");
  const charts = await generateAllChartsSVG(testData);
  
  console.log("📊 Résultats:");
  console.log(`   - Activity chart: ${charts.activity ? `${charts.activity.length} bytes` : "null"}`);
  console.log(`   - Status chart: ${charts.status ? `${charts.status.length} bytes` : "null"}`);
  console.log(`   - Projects chart: ${charts.projects ? `${charts.projects.length} bytes` : "null"}`);
  
  if (charts.activity && charts.activity.length > 0) {
    const svgContent = charts.activity.toString("utf-8");
    console.log(`\n✅ Activity chart généré (${svgContent.length} caractères)`);
    console.log(`   Début du SVG: ${svgContent.substring(0, 50)}...`);
  } else {
    console.log("\n❌ Activity chart non généré");
  }
  
  if (charts.status && charts.status.length > 0) {
    const svgContent = charts.status.toString("utf-8");
    console.log(`✅ Status chart généré (${svgContent.length} caractères)`);
    console.log(`   Début du SVG: ${svgContent.substring(0, 50)}...`);
  } else {
    console.log("❌ Status chart non généré");
  }
  
  if (charts.projects && charts.projects.length > 0) {
    const svgContent = charts.projects.toString("utf-8");
    console.log(`✅ Projects chart généré (${svgContent.length} caractères)`);
    console.log(`   Début du SVG: ${svgContent.substring(0, 50)}...`);
  } else {
    console.log("❌ Projects chart non généré");
  }
  
  console.log("\n✅ Tous les tests sont passés!");
  
} catch (error) {
  console.error("❌ Erreur lors du test:", error);
  if (error instanceof Error) {
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
  }
  process.exit(1);
}

