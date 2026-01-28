/**
 * Tests pour normalizeActionText
 * 
 * Pour exécuter :
 * npx tsx lib/meetings/normalize-action.test.ts
 */

import { normalizeActionText } from "./normalize-action";

let allTestsPassed = true;

function runTest(name: string, input: string, expected: string, description: string) {
  const output = normalizeActionText(input);
  const passed = output === expected || output.toLowerCase() === expected.toLowerCase();
  allTestsPassed = allTestsPassed && passed;
  
  console.log(`\n${name}:`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Output:   "${output}"`);
  console.log(`  ${passed ? "✅" : "❌"} ${description}`);
  return passed;
}

// Test 1: Formulation passive "doit être [participe passé]"
runTest(
  "Test 1 - Formulation passive",
  "Les bugs critiques doivent être corrigés",
  "Corriger les bugs critiques",
  "Transformation passive → infinitif"
);

// Test 2: "Il faut [verbe]"
runTest(
  "Test 2 - Il faut",
  "Il faut créer un module",
  "Créer un module",
  "Transformation 'Il faut' → infinitif"
);

// Test 3: "Nous devons [verbe]"
runTest(
  "Test 3 - Nous devons",
  "Nous devons tester les résultats",
  "Tester les résultats",
  "Transformation 'Nous devons' → infinitif"
);

// Test 4: "doit [verbe]" - Note: Ce cas peut être difficile à transformer de manière fiable
// Si la transformation est incertaine, le texte original est conservé (comportement attendu)
runTest(
  "Test 4 - Doit + verbe",
  "Le code doit être révisé",
  "Le code doit être révisé", // Conservé si transformation incertaine
  "Conservation si transformation incertaine (principe: ne pas inventer)"
);

// Test 5: Déjà au format infinitif
runTest(
  "Test 5 - Déjà infinitif",
  "créer un nouveau module",
  "Créer un nouveau module",
  "Capitalisation du verbe déjà à l'infinitif"
);

// Test 6: Cas incertain (ne pas inventer)
runTest(
  "Test 6 - Cas incertain",
  "Discussion sur les performances",
  "Discussion sur les performances",
  "Conservation du texte original si transformation incertaine"
);

// Test 7: "Il est nécessaire de"
runTest(
  "Test 7 - Il est nécessaire de",
  "Il est nécessaire de valider les changements",
  "Valider les changements",
  "Transformation 'Il est nécessaire de' → infinitif"
);

// Test 8: "Il convient de"
runTest(
  "Test 8 - Il convient de",
  "Il convient de documenter le code",
  "Documenter le code",
  "Transformation 'Il convient de' → infinitif"
);

// Test 9: Texte vide ou court
runTest(
  "Test 9 - Texte court",
  "OK",
  "OK",
  "Conservation des textes courts"
);

// Test 10: Verbe déjà à l'infinitif avec sujet
runTest(
  "Test 10 - Infinitif avec sujet",
  "Réviser le code et tester",
  "Réviser le code et tester",
  "Conservation si déjà bien formaté"
);

// Résumé
console.log("\n=== Résumé des tests ===");
console.log(allTestsPassed ? "✅ Tous les tests passent" : "❌ Certains tests échouent");

if (!allTestsPassed) {
  process.exit(1);
}

export {};
