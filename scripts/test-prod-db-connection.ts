/**
 * Script pour tester la connexion à la base de données de production
 * Utile pour diagnostiquer les problèmes de connexion sur Vercel
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Utiliser DATABASE_URL_PROD si disponible, sinon DATABASE_URL
const prodDatabaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error("❌ DATABASE_URL_PROD ou DATABASE_URL n'est pas définie");
  console.log("💡 Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
  process.exit(1);
}

// Vérifier que c'est bien une URL PostgreSQL
if (!prodDatabaseUrl.startsWith("postgresql://") && !prodDatabaseUrl.startsWith("postgres://")) {
  console.error("❌ DATABASE_URL_PROD doit être une URL PostgreSQL (postgresql:// ou postgres://)");
  console.log("💡 URL actuelle:", prodDatabaseUrl.substring(0, 50) + "...");
  process.exit(1);
}

console.log("🔍 Test de connexion à la base de données de production...");
console.log("📊 URL:", prodDatabaseUrl.substring(0, 50) + "...");

// Créer un schéma temporaire PostgreSQL si nécessaire
let tempSchemaPath = null;
try {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const currentSchema = fs.readFileSync(schemaPath, "utf-8");
  
  if (currentSchema.includes('provider = "sqlite"')) {
    console.log("📝 Création d'un schéma temporaire PostgreSQL...");
    tempSchemaPath = path.join(process.cwd(), "prisma", "schema-temp-postgres-test.prisma");
    const postgresSchema = currentSchema.replace(
      /provider\s*=\s*"sqlite"/,
      'provider = "postgresql"'
    );
    fs.writeFileSync(tempSchemaPath, postgresSchema);
  }
} catch (error) {
  console.log("⚠️  Impossible de créer le schéma temporaire");
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl,
    },
  },
});

async function testConnection() {
  try {
    console.log("🔄 Tentative de connexion...");
    
    // Test simple : compter les utilisateurs
    const userCount = await prisma.user.count();
    console.log(`✅ Connexion réussie ! Nombre d'utilisateurs: ${userCount}`);
    
    // Vérifier si la colonne isCompanyAdmin existe
    try {
      const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isCompanyAdmin'
        AND table_schema = 'public'
      `;
      
      if (result.length > 0) {
        console.log("✅ Le champ isCompanyAdmin existe dans la table User");
      } else {
        console.log("⚠️  Le champ isCompanyAdmin n'existe pas encore");
        console.log("💡 Exécutez: npm run db:migrate-prod pour l'ajouter");
      }
    } catch (schemaError: any) {
      console.log("⚠️  Impossible de vérifier le schéma:", schemaError.message?.substring(0, 200));
    }
    
    // Test de lecture d'un utilisateur
    const firstUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
      },
    });
    
    if (firstUser) {
      console.log("✅ Test de lecture réussi:");
      console.log(`   - Email: ${firstUser.email}`);
      console.log(`   - Role: ${firstUser.role}`);
      console.log(`   - Company ID: ${firstUser.companyId || "Aucune"}`);
    }
    
    console.log("✅ Tous les tests de connexion ont réussi !");
  } catch (error: any) {
    console.error("❌ Erreur de connexion:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    
    if (error.code === "P1001") {
      console.error("\n💡 Erreur P1001: La base de données n'est pas accessible");
      console.error("   - Vérifiez que l'URL de la base de données est correcte");
      console.error("   - Vérifiez que la base de données est en ligne");
      console.error("   - Vérifiez les paramètres de firewall si applicable");
    } else if (error.code === "P1000") {
      console.error("\n💡 Erreur P1000: Échec d'authentification");
      console.error("   - Vérifiez les identifiants dans l'URL de connexion");
    } else if (error.code === "P1003") {
      console.error("\n💡 Erreur P1003: La base de données n'existe pas");
      console.error("   - Vérifiez le nom de la base de données dans l'URL");
    } else if (error.message?.includes("timeout")) {
      console.error("\n💡 Timeout: La connexion a pris trop de temps");
      console.error("   - Vérifiez votre connexion internet");
      console.error("   - Vérifiez que la base de données est accessible");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    
    // Nettoyer le schéma temporaire
    if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
      try {
        fs.unlinkSync(tempSchemaPath);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
    }
  }
}

testConnection()
  .then(() => {
    console.log("\n✅ Test terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });

