/**
 * Script pour appliquer les migrations de manière sécurisée
 * Continue même si les migrations sont déjà appliquées ou en cas d'erreur non-critique
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Application des migrations Prisma...');

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  console.log('⚠️  Continuation du build sans migrations...');
  process.exit(0); // Continue le build
}

// Vérifier si DATABASE_URL est PostgreSQL (production Vercel)
const isPostgres = process.env.DATABASE_URL.startsWith('postgresql://') || 
                   process.env.DATABASE_URL.startsWith('postgres://');
const isSqlite = process.env.DATABASE_URL.startsWith('file:');

// Si c'est PostgreSQL mais que le schéma est SQLite, créer un schéma temporaire
let tempSchemaPath = null;
if (isPostgres) {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const currentSchema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Vérifier si le schéma est configuré pour SQLite
    if (currentSchema.includes('provider = "sqlite"')) {
      console.log('📝 Détection PostgreSQL en production, création d\'un schéma temporaire...');
      
      tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema-temp-postgres.prisma');
      const postgresSchema = currentSchema.replace(
        /provider\s*=\s*"sqlite"/,
        'provider = "postgresql"'
      );
      
      fs.writeFileSync(tempSchemaPath, postgresSchema);
      console.log('✅ Schéma temporaire PostgreSQL créé');
    }
  } catch (error) {
    console.log('⚠️  Impossible de créer le schéma temporaire, utilisation du schéma par défaut');
  }
}

const schemaToUse = tempSchemaPath || 'prisma/schema.prisma';

try {
  // Essayer d'abord prisma migrate deploy (pour les migrations formelles)
  execSync(`npx prisma migrate deploy --schema=${schemaToUse}`, { 
    stdio: 'pipe', // Utiliser 'pipe' pour capturer la sortie
    env: process.env,
    timeout: 30000 // 30 secondes de timeout
  });
  console.log('✅ Migrations appliquées avec succès');
  
  // Nettoyer le schéma temporaire si créé
  if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
  
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
      execSync(`npx prisma db push --accept-data-loss --skip-generate --schema=${schemaToUse}`, {
        stdio: 'inherit',
        env: process.env,
        timeout: 30000
      });
      console.log('✅ Schéma synchronisé avec succès (db push)');
      
      // Nettoyer le schéma temporaire si créé
      if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
        fs.unlinkSync(tempSchemaPath);
      }
      
      process.exit(0);
    } catch (pushError) {
      // Si db push échoue aussi, continuer quand même
      console.log('⚠️  Erreur lors de db push:', pushError.message?.substring(0, 200));
      console.log('💡 Continuation du build...');
      
      // Nettoyer le schéma temporaire si créé
      if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
        try {
          fs.unlinkSync(tempSchemaPath);
        } catch (cleanupError) {
          // Ignorer les erreurs de nettoyage
        }
      }
      
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
    
    // Nettoyer le schéma temporaire si créé
    if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
      try {
        fs.unlinkSync(tempSchemaPath);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
    }
    
    process.exit(0); // Continue le build
  } else {
    // Pour les autres erreurs, on continue quand même
    // Le build ne doit pas être bloqué par les migrations
    // Les erreurs seront gérées au runtime
    console.log('⚠️  Continuation du build malgré l\'erreur de migration...');
    console.log('💡 Vérifiez les logs de migration après le déploiement');
    
    // Nettoyer le schéma temporaire si créé
    if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
      try {
        fs.unlinkSync(tempSchemaPath);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
    }
    
    process.exit(0);
  }
}

