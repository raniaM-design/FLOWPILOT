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

// Trouver toutes les lignes DATABASE_URL (peuvent être sur plusieurs lignes)
const databaseUrlMatch = content.match(/DATABASE_URL\s*=\s*['"]([^'"]*(?:\n[^'"]*)*)['"]/s);

if (databaseUrlMatch) {
  console.log('📋 DATABASE_URL trouvée (peut être sur plusieurs lignes)');
  
  // Extraire l'URL complète (sans les guillemets et sauts de ligne)
  let urlValue = databaseUrlMatch[1];
  
  // Nettoyer : supprimer les sauts de ligne et espaces en début/fin
  urlValue = urlValue.replace(/\n/g, '').replace(/\r/g, '').trim();
  
  // Vérifier que c'est bien une URL PostgreSQL
  if (!urlValue.startsWith('postgresql://') && !urlValue.startsWith('postgres://')) {
    console.error('❌ L\'URL ne commence pas par postgresql:// ou postgres://');
    console.error('   URL:', urlValue.substring(0, 50) + '...');
    process.exit(1);
  }
  
  // Remplacer dans le contenu
  const newLine = `DATABASE_URL="${urlValue}"`;
  content = content.replace(/DATABASE_URL\s*=\s*['"]([^'"]*(?:\n[^'"]*)*)['"]/s, newLine);
  
  if (content !== originalContent) {
    // Sauvegarder le fichier corrigé
    fs.writeFileSync(envLocalPath, content, 'utf-8');
    console.log('✅ .env.local corrigé !');
    console.log('   DATABASE_URL est maintenant sur une seule ligne');
    console.log('\n📋 Nouvelle ligne DATABASE_URL:');
    console.log('   ' + newLine.substring(0, 80) + '...');
  } else {
    console.log('✅ .env.local semble déjà correct');
  }
} else {
  console.log('⚠️  DATABASE_URL non trouvée dans .env.local');
  console.log('   Vérifiez que le fichier contient: DATABASE_URL="..."');
}

console.log('\n💡 Vous pouvez maintenant exécuter:');
console.log('   npx prisma generate');

