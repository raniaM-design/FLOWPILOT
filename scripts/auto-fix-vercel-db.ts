/**
 * Script pour diagnostiquer et corriger automatiquement les problèmes de base de données sur Vercel
 * À exécuter après avoir ajouté DATABASE_URL sur Vercel
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function autoFixVercelDb() {
  console.log("🔧 Diagnostic et correction automatique de la base de données Vercel...\n");

  // Charger .env.local
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    envContent.split("\n").forEach((line: string) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          value = value.replace(/^["']|["']$/g, "");
          process.env[key] = value;
        }
      }
    });
  }

  // Vérifier DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL n'est pas définie dans .env.local");
    console.log("\n💡 Solution:");
    console.log("   1. Ajoutez DATABASE_URL sur Vercel:");
    console.log("      vercel env add DATABASE_URL production");
    console.log("   2. Récupérez les variables:");
    console.log("      vercel env pull .env.local");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL trouvée\n");

  // Vérifier le format
  const hasPlaceholders = 
    process.env.DATABASE_URL.includes("xxx") ||
    process.env.DATABASE_URL.includes("user:password") ||
    process.env.DATABASE_URL.includes("dbname");

  if (hasPlaceholders) {
    console.error("❌ DATABASE_URL contient des placeholders !");
    console.log("   Remplacez-les par votre vraie Connection String Neon");
    process.exit(1);
  }

  // Test de connexion
  console.log("🔄 Test de connexion...");
  try {
    await prisma.$connect();
    console.log("✅ Connexion réussie\n");
  } catch (error: any) {
    console.error("❌ Erreur de connexion:", error.message);
    console.log("   Code:", error.code);
    
    if (error.code === "P1000") {
      console.log("\n💡 Erreur P1000: Authentification échouée");
      console.log("   Régénérez le mot de passe sur Neon et mettez à jour DATABASE_URL");
    } else if (error.code === "P1001") {
      console.log("\n💡 Erreur P1001: Serveur inaccessible");
      console.log("   Vérifiez que votre projet Neon est actif");
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }

  // Vérifier les tables
  console.log("🔄 Vérification des tables...");
  let tablesExist = true;
  
  try {
    await prisma.user.count();
    console.log("✅ Table 'User' existe");
  } catch (error: any) {
    console.log("❌ Table 'User' n'existe pas");
    tablesExist = false;
  }

  try {
    await prisma.project.count();
    console.log("✅ Table 'Project' existe");
  } catch (error: any) {
    console.log("❌ Table 'Project' n'existe pas");
    tablesExist = false;
  }

  await prisma.$disconnect();

  // Si les tables n'existent pas, appliquer les migrations
  if (!tablesExist) {
    console.log("\n⚠️  Les tables n'existent pas. Application des migrations...\n");
    
    try {
      console.log("🔄 Exécution de: npm run db:deploy");
      execSync("npm run db:deploy", { 
        stdio: "inherit",
        env: process.env 
      });
      console.log("\n✅ Migrations appliquées avec succès !");
      
      // Vérifier à nouveau
      await prisma.$connect();
      const userCount = await prisma.user.count();
      const projectCount = await prisma.project.count();
      await prisma.$disconnect();
      
      console.log(`✅ Tables créées: User (${userCount}), Project (${projectCount})`);
      console.log("\n🎉 La base de données est maintenant configurée !");
      console.log("\n💡 Prochaines étapes:");
      console.log("   1. Redéployez sur Vercel");
      console.log("   2. Testez la création de compte");
      
    } catch (error: any) {
      console.error("\n❌ Erreur lors de l'application des migrations:", error.message);
      console.log("\n💡 Essayez manuellement:");
      console.log("   npm run db:deploy");
      process.exit(1);
    }
  } else {
    console.log("\n✅ Toutes les tables existent !");
    console.log("🎉 La base de données est correctement configurée.");
  }
}

autoFixVercelDb().catch((error) => {
  console.error("Erreur inattendue:", error);
  process.exit(1);
});

