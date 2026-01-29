/**
 * Script de diagnostic pour tester la connexion à la base de données
 * Usage: npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

async function testConnection() {
  console.log("🔍 Test de connexion à la base de données...\n");

  // Vérifier DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL n'est pas définie dans les variables d'environnement");
    console.log("\n💡 Pour définir DATABASE_URL:");
    console.log("   - Local: Créez un fichier .env.local avec DATABASE_URL=...");
    console.log("   - Vercel: Ajoutez DATABASE_URL dans Settings > Environment Variables");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL est définie");
  
  // Afficher des informations sur l'URL (sans le mot de passe)
  try {
    const url = new URL(databaseUrl);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || "5432 (défaut)"}`);
    console.log(`   Database: ${url.pathname.replace("/", "")}`);
    console.log(`   User: ${url.username}`);
  } catch (e) {
    console.log("   ⚠️ Format de l'URL invalide");
  }

  console.log("\n🔌 Tentative de connexion...");

  const prisma = new PrismaClient({
    log: ["error", "warn"],
  });

  try {
    // Test de connexion simple
    await prisma.$connect();
    console.log("✅ Connexion réussie!");

    // Test de requête simple
    console.log("\n📊 Test de requête...");
    const userCount = await prisma.user.count();
    console.log(`✅ Requête réussie! Nombre d'utilisateurs: ${userCount}`);

    // Test d'une requête plus complexe
    console.log("\n🔍 Test de requête complexe...");
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    console.log(`✅ Requête complexe réussie! Exemple d'utilisateur:`, users[0] || "Aucun utilisateur trouvé");

    console.log("\n✅ Tous les tests sont passés avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur de connexion:");
    
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      
      // Codes d'erreur Prisma courants
      const prismaError = error as any;
      if (prismaError.code) {
        console.error(`   Code: ${prismaError.code}`);
        
        switch (prismaError.code) {
          case "P1000":
            console.error("\n💡 Erreur d'authentification");
            console.error("   Vérifiez que le nom d'utilisateur et le mot de passe sont corrects dans DATABASE_URL");
            break;
          case "P1001":
            console.error("\n💡 Impossible d'atteindre la base de données");
            console.error("   Vérifiez que:");
            console.error("   - Le serveur PostgreSQL est démarré");
            console.error("   - L'host et le port sont corrects");
            console.error("   - Le firewall autorise la connexion");
            break;
          case "P1002":
            console.error("\n💡 Timeout de connexion");
            console.error("   La base de données met trop de temps à répondre");
            break;
          case "P1003":
            console.error("\n💡 Base de données introuvable");
            console.error("   Vérifiez que le nom de la base de données existe");
            break;
          default:
            console.error(`\n💡 Code d'erreur Prisma: ${prismaError.code}`);
        }
      }
      
      if (prismaError.meta) {
        console.error(`   Meta:`, prismaError.meta);
      }
    } else {
      console.error("   Erreur inconnue:", error);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Connexion fermée");
  }
}

testConnection().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});

