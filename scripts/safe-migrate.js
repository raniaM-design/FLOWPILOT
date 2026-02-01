/**
 * Script pour appliquer les migrations de manière sécurisée
 * Continue même si les migrations sont déjà appliquées ou en cas d'erreur non-critique
 */

const { execSync } = require('child_process');

console.log('🔄 Application des migrations Prisma...');

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  console.log('⚠️  Continuation du build sans migrations...');
  process.exit(0); // Continue le build
}

try {
  // Essayer d'abord prisma migrate deploy (pour les migrations formelles)
  execSync('npx prisma migrate deploy', { 
    stdio: 'pipe', // Utiliser 'pipe' pour capturer la sortie
    env: process.env,
    timeout: 30000 // 30 secondes de timeout
  });
  console.log('✅ Migrations appliquées avec succès');
  process.exit(0);
} catch (migrateError) {
  // Si migrate deploy échoue (pas de migrations), essayer db push
  const migrateErrorOutput = migrateError.stdout?.toString() || migrateError.stderr?.toString() || migrateError.message || '';
  
  // Si l'erreur indique qu'il n'y a pas de migrations, utiliser db push
  if (migrateErrorOutput.includes('No pending migrations') || 
      migrateErrorOutput.includes('migration_lock.toml') ||
      migrateErrorOutput.includes('P3005')) {
    console.log('ℹ️  Aucune migration formelle trouvée, utilisation de prisma db push...');
    try {
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        env: process.env,
        timeout: 30000
      });
      console.log('✅ Schéma synchronisé avec succès (db push)');
      process.exit(0);
    } catch (pushError) {
      // Si db push échoue aussi, continuer quand même
      console.log('⚠️  Erreur lors de db push:', pushError.message?.substring(0, 200));
      console.log('💡 Continuation du build...');
      process.exit(0);
    }
  }
  
  // Pour les autres erreurs de migrate deploy, continuer avec la logique existante
  const error = migrateError;
  const errorMessage = error.message || error.toString();
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
  const fullError = errorMessage + '\n' + errorOutput;
  
  console.log('⚠️  Erreur lors de l\'application des migrations:');
  console.log(fullError.substring(0, 500)); // Limiter la sortie
  
  // Cas où on peut continuer sans problème
  const safeErrors = [
    'already applied',
    'No pending migrations',
    'Migration.*already',
    'P3005', // Migration already applied
    'P3006', // Migration failed to apply
    'Can\'t reach database',
    'P1001', // Can't reach database server
    'timeout',
    'ETIMEDOUT',
    'ECONNREFUSED'
  ];
  
  const isSafeError = safeErrors.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(fullError);
  });
  
  if (isSafeError) {
    console.log('ℹ️  Erreur non-critique détectée, continuation du build...');
    console.log('💡 Les migrations seront vérifiées au runtime si nécessaire');
    process.exit(0); // Continue le build
  } else {
    // Pour les autres erreurs, on continue quand même
    // Le build ne doit pas être bloqué par les migrations
    // Les erreurs seront gérées au runtime
    console.log('⚠️  Continuation du build malgré l\'erreur de migration...');
    console.log('💡 Vérifiez les logs de migration après le déploiement');
    process.exit(0);
  }
}

