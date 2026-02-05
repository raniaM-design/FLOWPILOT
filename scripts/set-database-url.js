/**
 * Script pour définir DATABASE_URL dans .env.local
 * Usage: node scripts/set-database-url.js "postgresql://..."
 * OU: DATABASE_URL="postgresql://..." node scripts/set-database-url.js
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

// Obtenir l'URL depuis les arguments ou l'environnement
const newUrl = process.argv[2] || process.env.DATABASE_URL;

if (!newUrl) {
  console.error('❌ Aucune URL fournie');
  console.log('\n💡 Usage:');
  console.log('   node scripts/set-database-url.js "postgresql://user:pass@host/db"');
  console.log('   OU');
  console.log('   DATABASE_URL="postgresql://..." node scripts/set-database-url.js');
  console.log('\n📋 Pour obtenir votre Connection String:');
  console.log('   1. Allez sur https://console.neon.tech');
  console.log('   2. Cliquez sur votre projet');
  console.log('   3. Allez dans "Connection Details"');
  console.log('   4. Copiez la Connection String complète');
  process.exit(1);
}

// Nettoyer l'URL
let cleanUrl = newUrl.trim().replace(/^["']|["']$/g, '');

// Vérifier le format
if (!cleanUrl.startsWith('postgresql://') && !cleanUrl.startsWith('postgres://')) {
  console.error('❌ Format invalide. L\'URL doit commencer par postgresql:// ou postgres://');
  console.log(`   Reçu: ${cleanUrl.substring(0, 50)}...`);
  process.exit(1);
}

console.log('🔧 Mise à jour de DATABASE_URL dans .env.local...\n');

// Lire ou créer le fichier
let envContent = '';
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf-8');
} else {
  console.log('⚠️  .env.local n\'existe pas, création...');
}

// Chercher et remplacer DATABASE_URL
const lines = envContent.split('\n');
let found = false;
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Si c'est la ligne DATABASE_URL, la remplacer
  if (line.match(/^DATABASE_URL\s*=/)) {
    newLines.push(`DATABASE_URL="${cleanUrl}"`);
    found = true;
  } else {
    newLines.push(line);
  }
}

// Si pas trouvé, ajouter à la fin
if (!found) {
  if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
    newLines.push('');
  }
  newLines.push(`DATABASE_URL="${cleanUrl}"`);
}

// Réécrire le fichier
const newContent = newLines.join('\n');
fs.writeFileSync(envLocalPath, newContent, 'utf-8');

console.log('✅ DATABASE_URL mise à jour !');
console.log(`   ${cleanUrl.substring(0, 60)}...`);
console.log('\n💡 Prochaines étapes:');
console.log('   npm run db:check    # Vérifier la connexion');
console.log('   npm run db:deploy   # Appliquer les migrations');

