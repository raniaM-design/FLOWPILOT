/**
 * Script pour corriger automatiquement .env.local
 * Supprime les sauts de ligne dans DATABASE_URL
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  process.exit(1);
}

console.log('🔍 Lecture de .env.local...');

let content = fs.readFileSync(envLocalPath, 'utf-8');
const originalContent = content;

// Trouver DATABASE_URL (peut être sur plusieurs lignes ou sans guillemets)
let databaseUrlMatch = content.match(/DATABASE_URL\s*=\s*['"]([^'"]*(?:\r?\n[^'"]*)*)['"]/s);

// Si pas trouvé avec guillemets, chercher sans guillemets
if (!databaseUrlMatch) {
  databaseUrlMatch = content.match(/DATABASE_URL\s*=\s*([^\r\n]+(?:\r?\n[^\r\n=]*)*)/);
}

if (databaseUrlMatch) {
  console.log('📋 DATABASE_URL trouvée');
  
  // Extraire l'URL complète
  let urlValue = databaseUrlMatch[1];
  
  // Nettoyer : supprimer les sauts de ligne, retours chariot et espaces en début/fin
  urlValue = urlValue.replace(/\r?\n/g, '').replace(/\r/g, '').trim();
  
  // Retirer les guillemets s'ils sont encore présents
  if ((urlValue.startsWith('"') && urlValue.endsWith('"')) || 
      (urlValue.startsWith("'") && urlValue.endsWith("'"))) {
    urlValue = urlValue.slice(1, -1);
  }
  
  // Vérifier que c'est bien une URL PostgreSQL
  if (!urlValue.startsWith('postgresql://') && !urlValue.startsWith('postgres://')) {
    console.error('❌ L\'URL ne commence pas par postgresql:// ou postgres://');
    console.error('   URL actuelle:', urlValue.substring(0, 50) + '...');
    console.error('   Format attendu: postgresql://user:password@host/database');
    process.exit(1);
  }
  
  // Remplacer dans le contenu (gérer les deux formats)
  const newLine = `DATABASE_URL="${urlValue}"`;
  
  // Remplacer toutes les occurrences de DATABASE_URL (peu importe le format)
  content = content.replace(/DATABASE_URL\s*=\s*['"]([^'"]*(?:\r?\n[^'"]*)*)['"]/s, newLine);
  content = content.replace(/DATABASE_URL\s*=\s*([^\r\n]+(?:\r?\n[^\r\n=]*)*)/, newLine);
  
  if (content !== originalContent) {
    // Sauvegarder le fichier corrigé
    fs.writeFileSync(envLocalPath, content, 'utf-8');
    console.log('✅ .env.local corrigé !');
    console.log('   DATABASE_URL est maintenant sur une seule ligne');
    console.log('\n📋 Nouvelle ligne DATABASE_URL:');
    console.log('   ' + newLine.substring(0, 80) + '...');
  } else {
    console.log('✅ .env.local semble déjà correct');
    console.log('   URL:', urlValue.substring(0, 50) + '...');
  }
} else {
  console.log('⚠️  DATABASE_URL non trouvée dans .env.local');
  console.log('   Vérifiez que le fichier contient: DATABASE_URL="..."');
}

console.log('\n💡 Vous pouvez maintenant exécuter:');
console.log('   npx prisma generate');

