/**
 * Script de test simple pour sanitizeMeetingText
 * 
 * Usage: node scripts/test-sanitize-text.mjs
 * 
 * Note: Ce script nécessite que le fichier soit compilé ou utilise tsx/ts-node
 * Pour une version pure JS, voir sanitize-text.js
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction simplifiée pour les tests (version JS pure)
function sanitizeMeetingText(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  let cleaned = input;

  // Décoder les entités HTML courantes
  cleaned = cleaned
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
    .replace(/&iuml;/g, "ï")
    .replace(/&ucirc;/g, "û");

  // Décoder les entités HTML numériques courantes
  cleaned = cleaned.replace(/&#(\d{2,3});/g, (match, code) => {
    const num = parseInt(code, 10);
    if (num === 160) return " ";
    if (num >= 32 && num <= 126) return String.fromCharCode(num);
    if (num >= 160 && num <= 255) return String.fromCharCode(num);
    return match;
  });

  // Convertir d'abord les balises de bloc HTML en retours à la ligne
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
  cleaned = cleaned.replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, "\n");
  cleaned = cleaned.replace(/<(p|div|li|ul|ol|h[1-6])(\s[^>]*)?>/gi, "\n");

  // Enlever toutes les balises HTML restantes
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Normaliser les types de retours à la ligne
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Normaliser les espaces insécables
  cleaned = cleaned.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");

  // Remplacer les tabulations
  cleaned = cleaned.replace(/\t/g, " ");

  // Normaliser les espaces multiples
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // Normaliser les retours à la ligne multiples
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Supprimer les caractères de contrôle invisibles
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Nettoyer les espaces en début/fin de ligne
  cleaned = cleaned.split("\n").map(line => line.trim()).join("\n");

  // Supprimer les lignes vides en début/fin
  cleaned = cleaned.trim();

  return cleaned;
}

// Tests
console.log("=== Tests de sanitizeMeetingText ===\n");

// Test 1: Balises HTML simples
const test1Input = "<p>Décisions</p><ul><li>Action 1</li></ul>";
const test1Output = sanitizeMeetingText(test1Input);
console.log("Test 1 - Balises HTML simples:");
console.log("Input:", test1Input);
console.log("Output:", test1Output);
const test1Pass = test1Output.includes("Décisions") && test1Output.includes("Action 1") && !test1Output.includes("<");
console.log("✅ Pass:", test1Pass);
console.log("");

// Test 2: Entités HTML
const test2Input = "Décisions&nbsp;&nbsp;&nbsp;prises&nbsp;:&nbsp;<p>Action&nbsp;1</p>";
const test2Output = sanitizeMeetingText(test2Input);
console.log("Test 2 - Entités HTML:");
console.log("Input:", test2Input);
console.log("Output:", test2Output);
const test2Pass = test2Output.includes("Décisions prises") && !test2Output.includes("&nbsp;") && !test2Output.includes("<");
console.log("✅ Pass:", test2Pass);
console.log("");

// Test 3: Caractères Unicode parasites
const test3Input = "Décisions\u00A0\u2000prises:\u00A0<p>Action\u00A01</p>\t\t\n\n\n";
const test3Output = sanitizeMeetingText(test3Input);
console.log("Test 3 - Caractères Unicode parasites:");
console.log("Input: (avec espaces insécables et tabulations)");
console.log("Output:", JSON.stringify(test3Output));
const test3Pass = test3Output.includes("Décisions") && test3Output.includes("prises") && !test3Output.includes("\u00A0") && !test3Output.includes("\t");
console.log("✅ Pass:", test3Pass);
console.log("");

// Test 4: Préservation des mots-clés
const test4Input = "<div>Décisions</div><p>Actions</p><span>À venir</span>";
const test4Output = sanitizeMeetingText(test4Input);
console.log("Test 4 - Préservation des mots-clés:");
console.log("Input:", test4Input);
console.log("Output:", test4Output);
const test4Pass = test4Output.includes("Décisions") && test4Output.includes("Actions") && test4Output.includes("À venir");
console.log("✅ Pass:", test4Pass);
console.log("");

// Résumé
console.log("=== Résumé ===");
const allPassed = test1Pass && test2Pass && test3Pass && test4Pass;
console.log("Tous les tests:", allPassed ? "✅ PASSENT" : "❌ ÉCHOUENT");

if (!allPassed) {
  process.exit(1);
}


