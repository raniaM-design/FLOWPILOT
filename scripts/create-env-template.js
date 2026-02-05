/**
 * Script pour créer un template .env.local
 * À utiliser si .env.local est vide ou corrompu
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('📝 Création d\'un template .env.local...');

const template = `# Environment variables for FlowPilot
# Remplacez les valeurs ci-dessous par vos vraies valeurs

# Base de données PostgreSQL (Neon)
# Obtenez votre Connection String depuis: https://console.neon.tech
# Format: postgresql://user:password@host/database?sslmode=require
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Secret JWT pour l'authentification
# Générez avec: openssl rand -base64 32
FLOWPILOT_JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-caracteres"

# Configuration Microsoft Outlook OAuth (optionnel)
MICROSOFT_CLIENT_ID="votre_client_id"
MICROSOFT_CLIENT_SECRET="votre_client_secret"
MICROSOFT_TENANT_ID="common"
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/outlook/callback"
MICROSOFT_SCOPES="openid profile offline_access User.Read Calendars.Read email"
`;

// Vérifier si le fichier existe déjà
if (fs.existsSync(envLocalPath)) {
  const currentContent = fs.readFileSync(envLocalPath, 'utf-8');
  if (currentContent.trim().length > 0) {
    console.log('⚠️  .env.local existe déjà et n\'est pas vide');
    console.log('   Le fichier ne sera pas écrasé');
    console.log('   Si vous voulez le réinitialiser, supprimez-le d\'abord');
    process.exit(0);
  }
}

// Créer le fichier avec le template
fs.writeFileSync(envLocalPath, template, 'utf-8');

console.log('✅ Template .env.local créé !');
console.log('\n📋 Prochaines étapes:');
console.log('   1. Ouvrez .env.local');
console.log('   2. Remplacez DATABASE_URL par votre vraie Connection String Neon');
console.log('   3. Remplacez FLOWPILOT_JWT_SECRET par un secret généré');
console.log('   4. Sauvegardez le fichier');
console.log('\n💡 Pour obtenir votre Connection String Neon:');
console.log('   - Allez sur https://console.neon.tech');
console.log('   - Cliquez sur votre projet -> Connection Details');
console.log('   - Copiez la Connection String');
console.log('\n💡 Pour générer FLOWPILOT_JWT_SECRET:');
console.log('   openssl rand -base64 32');

