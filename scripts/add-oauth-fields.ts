/**
 * Script pour ajouter les champs OAuth à la table User
 */
import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

async function addOAuthFields() {
  console.log("🔧 Ajout des champs OAuth à la table User...\n");

  // Charger .env.local explicitement
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

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL n'est pas définie. Assurez-vous que .env.local est configuré.");
    process.exit(1);
  }

  try {
    await prisma.$connect();

    // Vérifier si les colonnes existent déjà
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      AND column_name IN ('authProvider', 'providerId', 'passwordHash');
    `;

    const existingColumns = columns.map(c => c.column_name);

    // Modifier passwordHash pour le rendre optionnel
    if (existingColumns.includes("passwordHash")) {
      console.log("🔍 Vérification de la colonne passwordHash...");
      const passwordHashNullable = await prisma.$queryRaw<Array<{ is_nullable: string }>>`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'passwordHash' 
        AND table_schema = 'public';
      `;
      
      if (passwordHashNullable[0]?.is_nullable === "NO") {
        console.log("➕ Modification de passwordHash pour le rendre optionnel...");
        await prisma.$executeRaw`
          ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
        `;
        console.log("✅ Colonne passwordHash est maintenant optionnelle");
      } else {
        console.log("✅ Colonne passwordHash est déjà optionnelle");
      }
    }

    // Ajouter authProvider si manquant
    if (!existingColumns.includes("authProvider")) {
      console.log("➕ Ajout de la colonne authProvider...");
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "authProvider" TEXT;
      `;
      console.log("✅ Colonne authProvider ajoutée");
    } else {
      console.log("✅ Colonne authProvider existe déjà");
    }

    // Ajouter providerId si manquant
    if (!existingColumns.includes("providerId")) {
      console.log("➕ Ajout de la colonne providerId...");
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "providerId" TEXT;
      `;
      console.log("✅ Colonne providerId ajoutée");
    } else {
      console.log("✅ Colonne providerId existe déjà");
    }

    // Créer l'index composite
    console.log("➕ Création de l'index composite...");
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");
      `;
      console.log("✅ Index composite créé");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("✅ Index composite existe déjà");
      } else {
        throw error;
      }
    }

    // Créer la contrainte unique composite
    console.log("➕ Création de la contrainte unique composite...");
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_authProvider_providerId_key" ON "User"("authProvider", "providerId") WHERE "authProvider" IS NOT NULL AND "providerId" IS NOT NULL;
      `;
      console.log("✅ Contrainte unique composite créée");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("✅ Contrainte unique composite existe déjà");
      } else {
        throw error;
      }
    }

    console.log("\n✅ Tous les champs OAuth ont été ajoutés avec succès !");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

addOAuthFields().catch((e) => {
  console.error("Erreur inattendue:", e);
  process.exit(1);
});

