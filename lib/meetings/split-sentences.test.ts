/**
 * Tests pour splitLongSentences
 * 
 * Pour exécuter :
 * npx tsx lib/meetings/split-sentences.test.ts
 */

import { splitLongSentences } from "./split-sentences";

let allTestsPassed = true;

function runTest(name: string, input: string[], expectedChecks: Array<{ check: () => boolean; desc: string }>) {
  const output = splitLongSentences(input);
  const passed = expectedChecks.every(({ check }) => check());
  allTestsPassed = allTestsPassed && passed;
  
  console.log(`\n${name}:`);
  console.log(`  Input:  ${JSON.stringify(input)}`);
  console.log(`  Output: ${JSON.stringify(output)}`);
  expectedChecks.forEach(({ desc, check }) => {
    console.log(`  ${check() ? "✅" : "❌"} ${desc}`);
  });
  return passed;
}

// Test 1: Phrases longues avec connecteurs
runTest(
  "Test 1 - Découpage sur connecteurs",
  [
    "Créer un nouveau module pour améliorer les performances et ensuite tester les résultats",
    "Réviser le code afin de corriger les bugs puis déployer en production",
  ],
  [
    { check: () => {
      const result = splitLongSentences([
        "Créer un nouveau module pour améliorer les performances et ensuite tester les résultats",
        "Réviser le code afin de corriger les bugs puis déployer en production",
      ]);
      return result.length > 2; // Doit être découpé en plusieurs items
    }, desc: "Phrases découpées en plusieurs items" },
    { check: () => {
      const result = splitLongSentences([
        "Créer un nouveau module pour améliorer les performances et ensuite tester les résultats",
      ]);
      return result.every(item => item.length > 0 && item.length < 100); // Items courts
    }, desc: "Items courts et actionnables" },
    { check: () => {
      const result = splitLongSentences([
        "Item 1 et Item 2",
      ]);
      return result.length === 2; // Découpage sur "et"
    }, desc: "Découpage sur 'et'" },
  ]
);

// Test 2: Phrases avec ponctuation forte
runTest(
  "Test 2 - Découpage sur ponctuation",
  [
    "Première action. Deuxième action. Troisième action",
    "Point un; Point deux; Point trois",
  ],
  [
    { check: () => {
      const result = splitLongSentences([
        "Première action. Deuxième action. Troisième action",
      ]);
      return result.length >= 2; // Doit être découpé
    }, desc: "Découpage sur point" },
    { check: () => {
      const result = splitLongSentences([
        "Point un; Point deux; Point trois",
      ]);
      return result.length >= 2; // Doit être découpé sur point-virgule
    }, desc: "Découpage sur point-virgule" },
  ]
);

// Test 3: Pas de doublons et items vides
runTest(
  "Test 3 - Pas de doublons ni items vides",
  [
    "Action 1",
    "Action 1", // Doublon
    "   ", // Item vide
    "Action 2 et Action 2", // Doublon dans la même phrase
  ],
  [
    { check: () => {
      const result = splitLongSentences([
        "Action 1",
        "Action 1",
        "   ",
      ]);
      return result.length === 1; // Un seul item (doublons supprimés, vide supprimé)
    }, desc: "Doublons supprimés" },
    { check: () => {
      const result = splitLongSentences([
        "   ",
        "",
        "Action valide",
      ]);
      return result.length === 1 && result[0] === "Action valide"; // Items vides supprimés
    }, desc: "Items vides supprimés" },
  ]
);

// Test 4: Items courts non modifiés
runTest(
  "Test 4 - Items courts conservés",
  [
    "Action courte",
    "Décision",
    "Point",
  ],
  [
    { check: () => {
      const result = splitLongSentences([
        "Action courte",
        "Décision",
      ]);
      return result.length === 2; // Items courts conservés
    }, desc: "Items courts non modifiés" },
  ]
);

// Résumé
console.log("\n=== Résumé des tests ===");
console.log(allTestsPassed ? "✅ Tous les tests passent" : "❌ Certains tests échouent");

if (!allTestsPassed) {
  process.exit(1);
}

export {};

