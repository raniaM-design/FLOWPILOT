/**
 * Script pour appliquer les migrations avec .env.local chargé explicitement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Charger .env.local explicitement
const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  process.exit(1);
}

console.log('📋 Chargement de .env.local...');

// Lire et parser .env.local
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Retirer les guillemets
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      envVars[key] = value;
    }
  }
});

// Vérifier DATABASE_URL
if (!envVars.DATABASE_URL) {
  console.error('❌ DATABASE_URL non trouvée dans .env.local');
  process.exit(1);
}

console.log('✅ DATABASE_URL trouvée');
console.log('   Prévisualisation:', envVars.DATABASE_URL.substring(0, 50) + '...');

// Vérifier le format
if (!envVars.DATABASE_URL.startsWith('postgresql://') && 
    !envVars.DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL ne commence pas par postgresql:// ou postgres://');
  console.error('   Format actuel:', envVars.DATABASE_URL.substring(0, 30));
  process.exit(1);
}

// Exécuter prisma migrate deploy avec les variables d'environnement
console.log('\n🔄 Application des migrations...');

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: envVars.DATABASE_URL,
    },
  });
  console.log('\n✅ Migrations appliquées avec succès !');
} catch (error) {
  console.error('\n❌ Erreur lors de l\'application des migrations');
  process.exit(1);
}

