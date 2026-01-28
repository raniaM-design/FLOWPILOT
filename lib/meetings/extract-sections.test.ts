/**
 * Tests pour extractSections
 * 
 * Pour exécuter :
 * npx tsx lib/meetings/extract-sections.test.ts
 */

import { extractSections } from "./extract-sections";

let allTestsPassed = true;

function runTest(name: string, input: string, expectedChecks: Array<{ check: () => boolean; desc: string }>) {
  const output = extractSections(input);
  const passed = expectedChecks.every(({ check }) => check());
  allTestsPassed = allTestsPassed && passed;
  
  console.log(`\n${name}:`);
  console.log(`  Input:  ${JSON.stringify(input)}`);
  console.log(`  Output:`, JSON.stringify(output, null, 2));
  expectedChecks.forEach(({ desc, check }) => {
    console.log(`  ${check() ? "✅" : "❌"} ${desc}`);
  });
  return passed;
}

// Test 1: Sections bien structurées
runTest(
  "Test 1 - Sections bien structurées",
  "Points abordés\n- Point 1\n- Point 2\n\nDécisions\n- Décision 1\n- Décision 2\n\nActions\n- Action 1\n- Action 2\n\nÀ venir\n- Sujet 1",
  [
    { check: () => extractSections("Points abordés\n- Point 1\n- Point 2\n\nDécisions\n- Décision 1\n- Décision 2\n\nActions\n- Action 1\n- Action 2\n\nÀ venir\n- Sujet 1").points.length > 0, desc: "Points extraits" },
    { check: () => extractSections("Points abordés\n- Point 1\n- Point 2\n\nDécisions\n- Décision 1\n- Décision 2\n\nActions\n- Action 1\n- Action 2\n\nÀ venir\n- Sujet 1").decisions.length > 0, desc: "Décisions extraites" },
    { check: () => extractSections("Points abordés\n- Point 1\n- Point 2\n\nDécisions\n- Décision 1\n- Décision 2\n\nActions\n- Action 1\n- Action 2\n\nÀ venir\n- Sujet 1").actions.length > 0, desc: "Actions extraites" },
    { check: () => extractSections("Points abordés\n- Point 1\n- Point 2\n\nDécisions\n- Décision 1\n- Décision 2\n\nActions\n- Action 1\n- Action 2\n\nÀ venir\n- Sujet 1").next.length > 0, desc: "À venir extraits" },
  ]
);

// Test 2: Variantes de titres
runTest(
  "Test 2 - Variantes de titres",
  "Points\n- Point 1\n\nDécision\n- Décision 1\n\nAction\n- Action 1\n\nA venir\n- Sujet 1",
  [
    { check: () => extractSections("Points\n- Point 1\n\nDécision\n- Décision 1\n\nAction\n- Action 1\n\nA venir\n- Sujet 1").points.length > 0, desc: "Points (singulier) détectés" },
    { check: () => extractSections("Points\n- Point 1\n\nDécision\n- Décision 1\n\nAction\n- Action 1\n\nA venir\n- Sujet 1").decisions.length > 0, desc: "Décision (singulier) détectée" },
    { check: () => extractSections("Points\n- Point 1\n\nDécision\n- Décision 1\n\nAction\n- Action 1\n\nA venir\n- Sujet 1").actions.length > 0, desc: "Action (singulier) détectée" },
    { check: () => extractSections("Points\n- Point 1\n\nDécision\n- Décision 1\n\nAction\n- Action 1\n\nA venir\n- Sujet 1").next.length > 0, desc: "A venir (sans accent) détecté" },
  ]
);

// Test 3: Aucune section détectée (fallback sur points)
runTest(
  "Test 3 - Aucune section (fallback)",
  "Texte libre sans sections\n- Item 1\n- Item 2\n- Item 3",
  [
    { check: () => extractSections("Texte libre sans sections\n- Item 1\n- Item 2\n- Item 3").points.length > 0, desc: "Tout placé dans points par défaut" },
    { check: () => extractSections("Texte libre sans sections\n- Item 1\n- Item 2\n- Item 3").decisions.length === 0, desc: "Aucune décision" },
    { check: () => extractSections("Texte libre sans sections\n- Item 1\n- Item 2\n- Item 3").actions.length === 0, desc: "Aucune action" },
    { check: () => extractSections("Texte libre sans sections\n- Item 1\n- Item 2\n- Item 3").next.length === 0, desc: "Aucun sujet à venir" },
  ]
);

// Résumé
console.log("\n=== Résumé des tests ===");
console.log(allTestsPassed ? "✅ Tous les tests passent" : "❌ Certains tests échouent");

if (!allTestsPassed) {
  process.exit(1);
}

export {};

