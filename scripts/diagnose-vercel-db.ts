/**
 * Script de diagnostic pour les problèmes de connexion Vercel
 * Aide à identifier les problèmes de configuration de base de données
 */

console.log("🔍 Diagnostic de la configuration de la base de données...\n");

// Vérifier les variables d'environnement
console.log("1. Variables d'environnement:");
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Définie" : "❌ Non définie"}`);
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const prefix = url.substring(0, 20);
  console.log(`   - Préfixe URL: ${prefix}...`);
  
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    console.log("   - Type: ✅ PostgreSQL");
  } else if (url.startsWith("file:")) {
    console.log("   - Type: ⚠️  SQLite (ne devrait pas être utilisé en production)");
  } else {
    console.log("   - Type: ❌ Format inconnu");
  }
}

console.log(`   - FLOWPILOT_JWT_SECRET: ${process.env.FLOWPILOT_JWT_SECRET ? "✅ Définie" : "❌ Non définie"}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || "non défini"}`);
console.log(`   - VERCEL: ${process.env.VERCEL || "non défini"}`);

// Vérifier le schéma Prisma
console.log("\n2. Configuration du schéma Prisma:");
try {
  const fs = require("fs");
  const path = require("path");
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  
  if (schema.includes('provider = "sqlite"')) {
    console.log("   - Provider: ⚠️  SQLite");
    console.log("   - ⚠️  ATTENTION: Le schéma est configuré pour SQLite mais vous utilisez PostgreSQL en production");
    console.log("   - 💡 Le script safe-migrate.js devrait créer un schéma temporaire PostgreSQL");
  } else if (schema.includes('provider = "postgresql"')) {
    console.log("   - Provider: ✅ PostgreSQL");
  } else {
    console.log("   - Provider: ❓ Non détecté");
  }
} catch (error: any) {
  console.log(`   - ❌ Erreur lors de la lecture du schéma: ${error.message}`);
}

// Test de connexion si DATABASE_URL est PostgreSQL
if (process.env.DATABASE_URL && 
    (process.env.DATABASE_URL.startsWith("postgresql://") || 
     process.env.DATABASE_URL.startsWith("postgres://"))) {
  console.log("\n3. Test de connexion à la base de données:");
  
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    // Test simple de connexion
    prisma.$connect()
      .then(async () => {
        console.log("   - ✅ Connexion réussie");
        
        try {
          const count = await prisma.$queryRaw`SELECT 1 as test`;
          console.log("   - ✅ Requête SQL réussie");
          
          // Vérifier si la table User existe
          try {
            const userCount = await (prisma as any).user.count();
            console.log(`   - ✅ Table User accessible (${userCount} utilisateurs)`);
            
            // Vérifier si isCompanyAdmin existe
            try {
              const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'User' 
                AND column_name = 'isCompanyAdmin'
                AND table_schema = 'public'
              `;
              
              if (result.length > 0) {
                console.log("   - ✅ Colonne isCompanyAdmin existe");
              } else {
                console.log("   - ⚠️  Colonne isCompanyAdmin n'existe pas encore");
                console.log("   - 💡 Exécutez la migration: npm run db:migrate-prod");
              }
            } catch (schemaError: any) {
              console.log(`   - ⚠️  Impossible de vérifier isCompanyAdmin: ${schemaError.message?.substring(0, 100)}`);
            }
          } catch (userError: any) {
            console.log(`   - ❌ Erreur lors de l'accès à la table User: ${userError.message?.substring(0, 100)}`);
            console.log(`   - Code d'erreur: ${userError.code || "N/A"}`);
          }
        } catch (queryError: any) {
          console.log(`   - ❌ Erreur lors de la requête SQL: ${queryError.message?.substring(0, 100)}`);
        }
        
        return prisma.$disconnect();
      })
      .then(() => {
        console.log("\n✅ Diagnostic terminé");
        process.exit(0);
      })
      .catch((error: any) => {
        console.log(`   - ❌ Erreur de connexion: ${error.message}`);
        console.log(`   - Code: ${error.code || "N/A"}`);
        
        if (error.code === "P1001") {
          console.log("\n💡 Solution: Vérifiez que:");
          console.log("   - La base de données est en ligne");
          console.log("   - L'URL de connexion est correcte");
          console.log("   - Les paramètres de firewall permettent la connexion");
        } else if (error.code === "P1000") {
          console.log("\n💡 Solution: Vérifiez les identifiants dans DATABASE_URL");
        } else if (error.code === "P1003") {
          console.log("\n💡 Solution: Vérifiez que la base de données existe");
        }
        
        process.exit(1);
      });
  } catch (error: any) {
    console.log(`   - ❌ Erreur lors de l'initialisation de Prisma: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log("\n3. Test de connexion:");
  console.log("   - ⚠️  Impossible de tester: DATABASE_URL n'est pas PostgreSQL");
  console.log("\n✅ Diagnostic terminé");
  process.exit(0);
}

