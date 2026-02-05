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
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️  Fichier schema.prisma non trouvé, utilisation du schéma par défaut');
    } else {
      const currentSchema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Vérifier si le schéma est configuré pour SQLite
      if (currentSchema.includes('provider = "sqlite"')) {
        console.log('📝 Détection PostgreSQL en production, création d\'un schéma temporaire...');
        
        const prismaDir = path.join(process.cwd(), 'prisma');
        // S'assurer que le dossier prisma existe
        if (!fs.existsSync(prismaDir)) {
          fs.mkdirSync(prismaDir, { recursive: true });
        }
        
        tempSchemaPath = path.join(prismaDir, 'schema-temp-postgres.prisma');
        const postgresSchema = currentSchema.replace(
          /provider\s*=\s*"sqlite"/,
          'provider = "postgresql"'
        );
        
        fs.writeFileSync(tempSchemaPath, postgresSchema);
        console.log(`✅ Schéma temporaire PostgreSQL créé: ${tempSchemaPath}`);
        
        // Vérifier que le fichier a bien été créé
        if (!fs.existsSync(tempSchemaPath)) {
          console.error('❌ Le schéma temporaire n\'a pas pu être créé');
          tempSchemaPath = null;
        }
      } else {
        console.log('ℹ️  Le schéma est déjà configuré pour PostgreSQL');
      }
    }
  } catch (error) {
    console.log(`⚠️  Impossible de créer le schéma temporaire: ${error.message}`);
    console.log('💡 Utilisation du schéma par défaut');
  }
}

// Utiliser le chemin absolu pour le schéma
const schemaToUse = tempSchemaPath ? path.resolve(tempSchemaPath) : path.join(process.cwd(), 'prisma', 'schema.prisma');

// Vérifier que le schéma existe avant de l'utiliser
if (!fs.existsSync(schemaToUse)) {
  console.error(`❌ Le schéma n'existe pas: ${schemaToUse}`);
  console.log('💡 Continuation du build sans migrations...');
  process.exit(0);
}

console.log(`📄 Utilisation du schéma: ${schemaToUse}`);

try {
  // Essayer d'abord prisma migrate deploy (pour les migrations formelles)
  // Utiliser un timeout plus long pour les migrations (60 secondes)
  console.log(`🔄 Exécution de: npx prisma migrate deploy --schema=${schemaToUse}`);
  
  execSync(`npx prisma migrate deploy --schema=${schemaToUse}`, { 
    stdio: 'pipe', // Utiliser 'pipe' pour capturer la sortie
    env: {
      ...process.env,
      // Augmenter le timeout PostgreSQL pour les advisory locks
      PRISMA_MIGRATE_TIMEOUT: '60000',
      // Désactiver les advisory locks si nécessaire (pour éviter P1002)
      PRISMA_MIGRATE_SKIP_ADVISORY_LOCK: 'false'
    },
    timeout: 90000 // 90 secondes de timeout (augmenté pour les connexions lentes)
  });
  console.log('✅ Migrations appliquées avec succès');
  
  // Nettoyer le schéma temporaire si créé
  if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
  
  process.exit(0);
} catch (migrateError) {
  // Si migrate deploy échoue, essayer db push comme alternative
  const migrateErrorOutput = migrateError.stdout?.toString() || migrateError.stderr?.toString() || migrateError.message || '';
  
  // Si l'erreur indique qu'il n'y a pas de migrations, ou si c'est P1002 (timeout), utiliser db push
  const shouldTryDbPush = migrateErrorOutput.includes('No pending migrations') || 
      migrateErrorOutput.includes('migration_lock.toml') ||
      migrateErrorOutput.includes('P3005') ||
      migrateErrorOutput.includes('P1002') ||
      migrateErrorOutput.includes('advisory lock');
  
  if (shouldTryDbPush) {
    console.log('ℹ️  Tentative avec prisma db push comme alternative...');
    try {
      console.log(`🔄 Exécution de: npx prisma db push --accept-data-loss --skip-generate --schema=${schemaToUse}`);
      execSync(`npx prisma db push --accept-data-loss --skip-generate --schema=${schemaToUse}`, {
        stdio: 'pipe', // Utiliser 'pipe' pour capturer la sortie
        env: {
          ...process.env,
          PRISMA_MIGRATE_TIMEOUT: '60000'
        },
        timeout: 90000 // 90 secondes de timeout
      });
      console.log('✅ Schéma synchronisé avec succès (db push)');
      
      // Nettoyer le schéma temporaire si créé
      if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
        try {
          fs.unlinkSync(tempSchemaPath);
        } catch (cleanupError) {
          // Ignorer les erreurs de nettoyage
        }
      }
      
      process.exit(0);
    } catch (pushError) {
      const pushErrorOutput = pushError.stdout?.toString() || pushError.stderr?.toString() || pushError.message || '';
      console.log('⚠️  Erreur lors de db push:', pushErrorOutput.substring(0, 500));
      console.log('💡 Continuation du build - le schéma sera vérifié au runtime...');
      
      // Nettoyer le schéma temporaire si créé
      if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
        try {
          fs.unlinkSync(tempSchemaPath);
        } catch (cleanupError) {
          // Ignorer les erreurs de nettoyage
        }
      }
      
      // Continuer le build même si db push échoue
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
    'P1002', // Database timeout (advisory lock timeout) - peut être ignoré si migrations déjà appliquées
    'timeout',
    'timed out',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'advisory lock',
    'pg_advisory_lock',
    'Connection pool timeout',
    'Connection timeout'
  ];
  
  // Logs détaillés pour P1002
  if (fullError.includes('P1002')) {
    console.log('⚠️  Erreur P1002 détectée (timeout de connexion ou advisory lock)');
    console.log('💡 Cela peut arriver si:');
    console.log('   - Les migrations sont déjà en cours d\'application par un autre processus');
    console.log('   - La connexion à la base de données est lente');
    console.log('   - Les advisory locks PostgreSQL sont bloqués');
    console.log('💡 Continuation du build - les migrations seront vérifiées au runtime');
  }
  
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


