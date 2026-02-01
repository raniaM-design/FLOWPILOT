/**
 * Script pour générer Prisma Client avec le bon provider avant le build
 * Détecte automatiquement le provider depuis DATABASE_URL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Prisma...');

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  console.log('⚠️  Génération du client Prisma avec le schéma par défaut...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
    process.exit(0);
  } catch (error) {
    console.log('⚠️  Erreur lors de la génération, continuation...');
    process.exit(0);
  }
}

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
const isSqlite = databaseUrl.startsWith('file:');

console.log(`📊 DATABASE_URL détectée: ${isPostgres ? 'PostgreSQL' : isSqlite ? 'SQLite' : 'Inconnu'}`);

// Si c'est PostgreSQL mais que le schéma est SQLite, créer un schéma temporaire
let tempSchemaPath = null;
if (isPostgres) {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const currentSchema = fs.readFileSync(schemaPath, 'utf-8');
    
    if (currentSchema.includes('provider = "sqlite"')) {
      console.log('📝 Création d\'un schéma temporaire PostgreSQL pour la génération du client...');
      
      tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema-temp-postgres.prisma');
      const postgresSchema = currentSchema.replace(
        /provider\s*=\s*"sqlite"/,
        'provider = "postgresql"'
      );
      
      fs.writeFileSync(tempSchemaPath, postgresSchema);
      console.log('✅ Schéma temporaire PostgreSQL créé');
      
      // Générer le client Prisma avec le schéma PostgreSQL
      console.log('🔨 Génération du client Prisma avec le provider PostgreSQL...');
      try {
        execSync(`npx prisma generate --schema=${tempSchemaPath}`, {
          stdio: 'inherit',
          env: process.env,
        });
        console.log('✅ Client Prisma généré avec succès (PostgreSQL)');
      } catch (generateError) {
        console.log('⚠️  Erreur lors de la génération avec le schéma temporaire, tentative avec le schéma par défaut...');
        execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
      }
    } else {
      // Le schéma est déjà PostgreSQL, générer normalement
      console.log('🔨 Génération du client Prisma...');
      execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
      console.log('✅ Client Prisma généré avec succès');
    }
  } catch (error) {
    console.log('⚠️  Erreur lors de la création du schéma temporaire, génération avec le schéma par défaut...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
    } catch (generateError) {
      console.log('⚠️  Erreur lors de la génération, continuation du build...');
    }
  } finally {
    // Nettoyer le schéma temporaire
    if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
      try {
        fs.unlinkSync(tempSchemaPath);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
    }
  }
} else {
  // SQLite ou autre, générer normalement
  console.log('🔨 Génération du client Prisma...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
    console.log('✅ Client Prisma généré avec succès');
  } catch (error) {
    console.log('⚠️  Erreur lors de la génération, continuation du build...');
  }
}

console.log('✅ Préparation Prisma terminée');

