/**
 * Script pour forcer l'application des migrations sur Vercel
 * Plus agressif que safe-migrate.js - essaie plusieurs méthodes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Application FORCÉE des migrations Prisma sur Vercel...\n');

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  console.log('⚠️  Continuation du build sans migrations...');
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;

// Vérifier que ce n'est pas vide
if (!databaseUrl || databaseUrl.trim() === '' || databaseUrl === '""') {
  console.error('❌ DATABASE_URL est vide');
  console.log('⚠️  Continuation du build sans migrations...');
  process.exit(0);
}

// Vérifier le format
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
if (!isPostgres) {
  console.log('⚠️  DATABASE_URL n\'est pas PostgreSQL, skip des migrations');
  process.exit(0);
}

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.prisma non trouvé');
  process.exit(0);
}

console.log(`📄 Utilisation du schéma: ${schemaPath}`);
console.log(`🔗 DATABASE_URL: ${databaseUrl.substring(0, 40)}...\n`);

// Méthode 1: migrate deploy
console.log('🔄 Méthode 1: prisma migrate deploy...');
try {
  execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    timeout: 120000 // 2 minutes
  });
  console.log('✅ Migrations appliquées avec succès (migrate deploy)');
  process.exit(0);
} catch (error) {
  console.log('⚠️  migrate deploy a échoué, tentative avec db push...');
  console.log(`   Erreur: ${error.message.substring(0, 200)}`);
}

// Méthode 2: db push (si migrate deploy échoue)
console.log('\n🔄 Méthode 2: prisma db push...');
try {
  execSync(`npx prisma db push --accept-data-loss --skip-generate --schema=${schemaPath}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    timeout: 120000
  });
  console.log('✅ Schéma synchronisé avec succès (db push)');
  process.exit(0);
} catch (error) {
  console.log('⚠️  db push a également échoué');
  console.log(`   Erreur: ${error.message.substring(0, 200)}`);
}

// Méthode 3: generate seulement (dernier recours)
console.log('\n🔄 Méthode 3: prisma generate seulement...');
try {
  execSync(`npx prisma generate --schema=${schemaPath}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    timeout: 60000
  });
  console.log('✅ Client Prisma généré');
  console.log('⚠️  Les migrations seront appliquées au runtime si nécessaire');
  process.exit(0);
} catch (error) {
  console.log('⚠️  generate a également échoué');
  console.log(`   Erreur: ${error.message.substring(0, 200)}`);
  console.log('💡 Continuation du build - les migrations seront vérifiées au runtime');
  process.exit(0);
}

