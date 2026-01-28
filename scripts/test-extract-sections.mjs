/**
 * Script de test simple pour extractSections
 * 
 * Usage: node scripts/test-extract-sections.mjs
 */

// Import dynamique pour tester (nécessite tsx ou compilation)
// Pour une version pure JS, copier la fonction ici

const testCases = [
  {
    name: "Test 1 - Sections complètes",
    input: `Points abordés
- Point 1
- Point 2

Décisions
- Décision 1
- Décision 2

Actions
- Action 1
- Action 2

À venir
- Sujet 1`,
    expected: {
      hasPoints: true,
      hasDecisions: true,
      hasActions: true,
      hasNext: true,
    },
  },
  {
    name: "Test 2 - Variantes de titres",
    input: `Points
- Point 1

Décision
- Décision 1

Action
- Action 1

A venir
- Sujet 1`,
    expected: {
      hasPoints: true,
      hasDecisions: true,
      hasActions: true,
      hasNext: true,
    },
  },
  {
    name: "Test 3 - Aucune section (fallback)",
    input: `Texte libre sans sections
- Item 1
- Item 2
- Item 3`,
    expected: {
      hasPoints: true,
      hasDecisions: false,
      hasActions: false,
      hasNext: false,
    },
  },
];

console.log("=== Tests de extractSections ===\n");
console.log("Note: Ce script nécessite tsx pour exécuter le code TypeScript.");
console.log("Pour tester: npx tsx -e \"import { extractSections } from './lib/meetings/extract-sections.ts'; console.log(extractSections('Points\\n- Point 1'));\"\n");

console.log("Pour tester manuellement:");
console.log("npx tsx lib/meetings/extract-sections.test.ts\n");

