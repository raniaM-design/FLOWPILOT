/**
 * Tests simples pour sanitizeMeetingText
 * 
 * Pour exécuter :
 * npx tsx lib/meetings/sanitize-text.test.ts
 */

import { sanitizeMeetingText } from "./sanitize-text";

let allTestsPassed = true;

function runTest(name: string, input: string, expectedChecks: Array<{ check: () => boolean; desc: string }>) {
  const output = sanitizeMeetingText(input);
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

// Test 1: Balises HTML simples avec structure préservée
runTest(
  "Test 1 - Balises HTML simples",
  "<p>Décisions</p><ul><li>Action 1</li></ul>",
  [
    { check: () => sanitizeMeetingText("<p>Décisions</p><ul><li>Action 1</li></ul>").includes("Décisions"), desc: "Contient 'Décisions'" },
    { check: () => sanitizeMeetingText("<p>Décisions</p><ul><li>Action 1</li></ul>").includes("Action 1"), desc: "Contient 'Action 1'" },
    { check: () => !sanitizeMeetingText("<p>Décisions</p><ul><li>Action 1</li></ul>").includes("<"), desc: "Aucune balise HTML restante" },
  ]
);

// Test 2: Entités HTML et espaces multiples
runTest(
  "Test 2 - Entités HTML et espaces",
  "Décisions&nbsp;&nbsp;&nbsp;prises&nbsp;:&nbsp;<p>Action&nbsp;1</p>",
  [
    { check: () => sanitizeMeetingText("Décisions&nbsp;&nbsp;&nbsp;prises&nbsp;:&nbsp;<p>Action&nbsp;1</p>").includes("Décisions prises"), desc: "Contient 'Décisions prises'" },
    { check: () => !sanitizeMeetingText("Décisions&nbsp;&nbsp;&nbsp;prises&nbsp;:&nbsp;<p>Action&nbsp;1</p>").includes("&nbsp;"), desc: "Entités &nbsp; décodées" },
    { check: () => !sanitizeMeetingText("Décisions&nbsp;&nbsp;&nbsp;prises&nbsp;:&nbsp;<p>Action&nbsp;1</p>").includes("<"), desc: "Aucune balise HTML restante" },
  ]
);

// Test 3: Caractères Unicode parasites et symboles
runTest(
  "Test 3 - Caractères Unicode parasites",
  "Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n",
  [
    { check: () => sanitizeMeetingText("Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n").includes("Décisions"), desc: "Contient 'Décisions'" },
    { check: () => sanitizeMeetingText("Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n").includes("prises"), desc: "Contient 'prises'" },
    { check: () => !sanitizeMeetingText("Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n").includes("\u00A0"), desc: "Espaces insécables normalisés" },
    { check: () => !sanitizeMeetingText("Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n").includes("\t"), desc: "Tabulations supprimées" },
  ]
);

// Test 4: Préservation des mots-clés importants
runTest(
  "Test 4 - Préservation des mots-clés importants",
  "<div>Décisions</div><p>Actions</p><span>À venir</span>",
  [
    { check: () => sanitizeMeetingText("<div>Décisions</div><p>Actions</p><span>À venir</span>").includes("Décisions"), desc: "Préserve 'Décisions'" },
    { check: () => sanitizeMeetingText("<div>Décisions</div><p>Actions</p><span>À venir</span>").includes("Actions"), desc: "Préserve 'Actions'" },
    { check: () => sanitizeMeetingText("<div>Décisions</div><p>Actions</p><span>À venir</span>").includes("À venir"), desc: "Préserve 'À venir'" },
  ]
);

// Résumé
console.log("\n=== Résumé des tests ===");
console.log(allTestsPassed ? "✅ Tous les tests passent" : "❌ Certains tests échouent");

if (!allTestsPassed) {
  process.exit(1);
}

export {};


