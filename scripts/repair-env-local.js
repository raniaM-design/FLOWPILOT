/**
 * Script pour réparer complètement .env.local
 * Gère les cas de corruption et fusion de lignes
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  process.exit(1);
}

console.log('🔧 Réparation complète de .env.local...');

let content = fs.readFileSync(envLocalPath, 'utf-8');

// Extraire DATABASE_URL même si corrompue
let databaseUrl = null;

// Chercher DATABASE_URL avec plusieurs patterns
const patterns = [
  /DATABASE_URL\s*=\s*["']([^"']*(?:\r?\n[^"']*)*)["']/s,
  /DATABASE_URL\s*=\s*([^\r\n=]+)/,
  /DATABASE_URL\s*=\s*postgresql:\/\/[^\r\n"']+/,
];

for (const pattern of patterns) {
  const match = content.match(pattern);
  if (match) {
    databaseUrl = match[1] || match[0].replace(/DATABASE_URL\s*=\s*/, '');
    break;
  }
}

if (databaseUrl) {
  // Nettoyer l'URL
  databaseUrl = databaseUrl
    .replace(/\r?\n/g, '')
    .replace(/\r/g, '')
    .trim();
  
  // Retirer les guillemets
  if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || 
      (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
    databaseUrl = databaseUrl.slice(1, -1);
  }
  
  // Retirer tout ce qui vient après un = (corruption)
  if (databaseUrl.includes('=') && !databaseUrl.startsWith('postgresql://')) {
    const parts = databaseUrl.split('=');
    databaseUrl = parts[0];
  }
  
  // Vérifier que c'est bien une URL PostgreSQL
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL invalide après nettoyage');
    console.error('   Valeur:', databaseUrl.substring(0, 100));
    console.error('\n💡 Veuillez mettre à jour DATABASE_URL manuellement dans .env.local');
    console.error('   Format attendu: DATABASE_URL="postgresql://user:password@host/database"');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL extraite et nettoyée');
  console.log('   Prévisualisation:', databaseUrl.substring(0, 50) + '...');
} else {
  console.error('❌ DATABASE_URL non trouvée dans .env.local');
  console.error('   Veuillez l\'ajouter manuellement');
  process.exit(1);
}

// Extraire les autres variables (MICROSOFT_*)
const otherVars = {};
const lines = content.split(/\r?\n/);

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.includes('DATABASE_URL')) {
    continue;
  }
  
  const match = trimmed.match(/^([A-Z_]+)\s*=\s*(.+)$/);
  if (match) {
    const key = match[1];
    let value = match[2].trim();
    
    // Retirer les guillemets
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Nettoyer la valeur (retirer les caractères corrompus)
    value = value.split('=')[0].trim();
    
    otherVars[key] = value;
  }
}

// Reconstruire le fichier proprement
let newContent = `# Environment variables for FlowPilot
# Generated automatically - do not edit manually

DATABASE_URL="${databaseUrl}"

`;

// Ajouter les autres variables
for (const [key, value] of Object.entries(otherVars)) {
  if (key && value) {
    newContent += `${key}="${value}"\n`;
  }
}

// Sauvegarder
fs.writeFileSync(envLocalPath, newContent, 'utf-8');

console.log('\n✅ .env.local réparé !');
console.log(`   DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);
console.log(`   Autres variables: ${Object.keys(otherVars).length}`);

console.log('\n💡 Prochaines étapes:');
console.log('   1. Vérifiez que DATABASE_URL est correcte');
console.log('   2. Si l\'authentification échoue, obtenez une nouvelle Connection String depuis Neon');
console.log('   3. Exécutez: npm run db:check');

