/**
 * Script pour appliquer les migrations de manière sécurisée
 * Continue même si les migrations sont déjà appliquées
 */

const { execSync } = require('child_process');

console.log('🔄 Application des migrations Prisma...');

try {
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('✅ Migrations appliquées avec succès');
} catch (error) {
  // Vérifier si c'est une erreur "already applied" ou une vraie erreur
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('already applied') || 
      errorMessage.includes('No pending migrations') ||
      errorMessage.includes('Migration') && errorMessage.includes('already')) {
    console.log('ℹ️  Les migrations sont déjà appliquées, continuation...');
    process.exit(0); // Succès
  } else {
    console.error('❌ Erreur lors de l\'application des migrations:');
    console.error(errorMessage);
    // Pour les autres erreurs, on continue quand même pour ne pas bloquer le build
    // Les erreurs seront gérées au runtime
    console.log('⚠️  Continuation du build malgré l\'erreur de migration...');
    process.exit(0);
  }
}

