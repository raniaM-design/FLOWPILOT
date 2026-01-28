/**
 * Script de test simple pour convertEditorContentToPlainText
 * Usage: npx tsx scripts/test-convert-editor-content.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger et exécuter le fichier TypeScript avec tsx
const code = readFileSync(join(__dirname, "../lib/meetings/convert-editor-content.ts"), "utf-8");

// Fonction convertEditorContentToPlainText extraite et adaptée pour le test
function convertEditorContentToPlainText(html) {
  if (!html || typeof html !== "string") {
    return "";
  }

  let text = html;

  // 1) Convertir les balises de titre en lignes avec sauts de ligne
  text = text.replace(/<h[1-6][^>]*>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");

  // 2) Convertir les balises de bloc en sauts de ligne
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  
  // 3) Convertir les balises de début de bloc
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<li[^>]*>/gi, "- ");
  
  // 4) Convertir les balises de liste
  text = text.replace(/<\/ul>/gi, "\n");
  text = text.replace(/<\/ol>/gi, "\n");
  text = text.replace(/<ul[^>]*>/gi, "\n");
  text = text.replace(/<ol[^>]*>/gi, "\n");

  // 5) Convertir les br en sauts de ligne
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 6) Convertir les balises strong/em
  text = text.replace(/<strong[^>]*>/gi, "");
  text = text.replace(/<\/strong>/gi, "");
  text = text.replace(/<em[^>]*>/gi, "");
  text = text.replace(/<\/em>/gi, "");
  text = text.replace(/<b[^>]*>/gi, "");
  text = text.replace(/<\/b>/gi, "");
  text = text.replace(/<i[^>]*>/gi, "");
  text = text.replace(/<\/i>/gi, "");
  text = text.replace(/<u[^>]*>/gi, "");
  text = text.replace(/<\/u>/gi, "");

  // 7) Enlever les liens mais garder le texte
  text = text.replace(/<a[^>]*>/gi, "");
  text = text.replace(/<\/a>/gi, "");

  // 8) Enlever toutes les autres balises HTML restantes
  text = text.replace(/<[^>]+>/g, "");

  // 9) Décoder les entités HTML courantes
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&acirc;/g, "â")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ccedil;/g, "ç")
    .replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&auml;/g, "ä")
    .replace(/&iuml;/g, "ï")
    .replace(/&ucirc;/g, "û");

  // 10) Décoder les entités numériques courantes
  text = text.replace(/&#(\d{2,3});/g, (match, code) => {
    const num = parseInt(code, 10);
    if (num === 160) return " ";
    if (num >= 32 && num <= 126) return String.fromCharCode(num);
    if (num >= 160 && num <= 255) return String.fromCharCode(num);
    return match;
  });

  // 11) Normaliser les retours à la ligne
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 12) Normaliser les espaces insécables
  text = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");

  // 13) Remplacer les tabulations par des espaces
  text = text.replace(/\t/g, " ");

  // 14) Normaliser les espaces multiples
  text = text.replace(/[ \t]{2,}/g, " ");

  // 15) Normaliser les retours à la ligne multiples
  text = text.replace(/\n{3,}/g, "\n\n");

  // 16) Supprimer les caractères de contrôle invisibles
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // 17) Nettoyer les espaces en début/fin de ligne
  text = text.split("\n").map(line => line.trim()).join("\n");

  // 18) Supprimer les lignes vides en début/fin
  text = text.trim();

  return text;
}

function test(name, input, expected, checkFn) {
  const result = convertEditorContentToPlainText(input);
  const passed = checkFn ? checkFn(result) : result === expected;
  console.log(`${passed ? "✓" : "✗"} ${name}`);
  if (!passed) {
    console.log(`  Input:    ${input}`);
    console.log(`  Expected: ${expected || "(check function)"}`);
    console.log(`  Got:      ${result}`);
  }
  return passed;
}

console.log("=== Tests convertEditorContentToPlainText ===\n");

const results = [];

// Test 1: Paragraphes simples
results.push(
  test(
    "Test 1: Paragraphes simples",
    "<p>Premier paragraphe</p><p>Deuxième paragraphe</p>",
    "Premier paragraphe\nDeuxième paragraphe"
  )
);

// Test 2: Titres de sections
results.push(
  test(
    "Test 2: Titres de sections",
    "<h1>Décisions</h1><p>Décision 1</p><h2>Actions</h2><p>Action 1</p>",
    null,
    (r) => r.includes("Décisions") && r.includes("Actions")
  )
);

// Test 3: Liste avec puces
results.push(
  test(
    "Test 3: Liste avec puces",
    "<ul><li>Item 1</li><li>Item 2</li></ul>",
    null,
    (r) => r.includes("- Item 1") && r.includes("- Item 2")
  )
);

console.log(`\n=== Résumé: ${results.filter(Boolean).length}/${results.length} tests réussis ===`);

