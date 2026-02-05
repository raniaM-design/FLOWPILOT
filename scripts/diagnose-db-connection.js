/**
 * Script de diagnostic pour la connexion à la base de données
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic de la connexion à la base de données...\n');

// Charger .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf-8');
let databaseUrl = null;

// Extraire DATABASE_URL
const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
if (match) {
  databaseUrl = match[1].trim();
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non trouvée dans .env.local');
  process.exit(1);
}

console.log('📋 DATABASE_URL trouvée:');
console.log(`   ${databaseUrl.substring(0, 60)}...\n`);

// Analyser l'URL
try {
  const url = new URL(databaseUrl);
  
  console.log('🔍 Analyse de l\'URL:');
  console.log(`   Protocole: ${url.protocol}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432 (défaut)'}`);
  console.log(`   Database: ${url.pathname.replace('/', '')}`);
  console.log(`   Username: ${url.username || 'non spécifié'}`);
  console.log(`   Password: ${url.password ? '***' + url.password.slice(-4) : 'non spécifié'}\n`);
  
  // Vérifications
  const issues = [];
  
  if (!url.hostname || url.hostname.includes('xxx')) {
    issues.push('❌ Host invalide ou placeholder (contient "xxx")');
  }
  
  if (!url.username || url.username === 'user') {
    issues.push('⚠️  Username semble être un placeholder');
  }
  
  if (!url.password || url.password === 'password') {
    issues.push('⚠️  Password semble être un placeholder');
  }
  
  if (!url.pathname || url.pathname === '/' || url.pathname.includes('dbname')) {
    issues.push('⚠️  Database name semble être un placeholder');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Problèmes détectés:\n');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n💡 Solution:');
    console.log('   1. Allez sur https://console.neon.tech');
    console.log('   2. Cliquez sur votre projet');
    console.log('   3. Allez dans "Connection Details"');
    console.log('   4. Copiez la Connection String COMPLÈTE');
    console.log('   5. Remplacez DATABASE_URL dans .env.local');
  } else {
    console.log('✅ Format de l\'URL semble correct');
    console.log('\n💡 Si vous avez toujours l\'erreur P1001:');
    console.log('   1. Vérifiez que votre projet Neon est actif (non suspendu)');
    console.log('   2. Vérifiez que l\'URL est exactement celle de Neon');
    console.log('   3. Essayez de vous connecter depuis le dashboard Neon');
    console.log('   4. Vérifiez votre connexion Internet');
  }
  
} catch (error) {
  console.error('❌ URL invalide:', error.message);
  console.log('\n💡 Vérifiez que DATABASE_URL est une URL valide');
  console.log('   Format attendu: postgresql://user:password@host/database');
}

