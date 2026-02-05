/**
 * Script pour vérifier la configuration des variables d'environnement
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Vérification des variables d\'environnement...\n');

const databaseUrl = process.env.DATABASE_URL;

console.log('DATABASE_URL:', databaseUrl ? '✅ Définie' : '❌ Non définie');

if (databaseUrl) {
  console.log('\n📋 Détails de DATABASE_URL:');
  console.log('   Longueur:', databaseUrl.length, 'caractères');
  console.log('   Prévisualisation:', databaseUrl.substring(0, 50) + '...');
  
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  const isSqlite = databaseUrl.startsWith('file:');
  
  console.log('\n🔍 Analyse:');
  console.log('   PostgreSQL:', isPostgres ? '✅' : '❌');
  console.log('   SQLite:', isSqlite ? '⚠️  (incompatible avec PostgreSQL)' : '✅');
  
  if (!isPostgres && !isSqlite) {
    console.log('\n❌ ERREUR: DATABASE_URL ne commence pas par postgresql://, postgres:// ou file:');
    console.log('   Format actuel:', databaseUrl.substring(0, 30));
  } else if (isSqlite) {
    console.log('\n❌ ERREUR: DATABASE_URL pointe vers SQLite mais le schéma est configuré pour PostgreSQL');
    console.log('   Solution: Utilisez votre DATABASE_URL Neon (PostgreSQL)');
  } else if (isPostgres) {
    console.log('\n✅ DATABASE_URL est correctement configurée pour PostgreSQL');
  }
} else {
  console.log('\n❌ ERREUR: DATABASE_URL n\'est pas définie');
  console.log('\n💡 Solution:');
  console.log('   1. Créez ou modifiez .env.local à la racine du projet');
  console.log('   2. Ajoutez: DATABASE_URL="postgresql://user:password@host/dbname"');
  console.log('   3. Remplacez par votre vraie DATABASE_URL Neon');
}

console.log('\n📁 Fichiers .env trouvés:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} n'existe pas`);
  }
});

