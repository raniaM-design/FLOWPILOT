/**
 * Script pour ajouter les colonnes manquantes à la table User
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUserColumns() {
  try {
    console.log("🔧 Ajout des colonnes manquantes à la table User...\n");
    
    // Vérifier si updatedAt existe
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      AND column_name IN ('updatedAt', 'avatarUrl');
    `;
    
    const existingColumns = columns.map(c => c.column_name);
    
    // Ajouter avatarUrl si manquant
    if (!existingColumns.includes("avatarUrl")) {
      console.log("➕ Ajout de la colonne avatarUrl...");
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
      `;
      console.log("✅ Colonne avatarUrl ajoutée");
    } else {
      console.log("✅ Colonne avatarUrl existe déjà");
    }
    
    // Ajouter updatedAt si manquant
    if (!existingColumns.includes("updatedAt")) {
      console.log("➕ Ajout de la colonne updatedAt...");
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `;
      console.log("✅ Colonne updatedAt ajoutée");
    } else {
      console.log("✅ Colonne updatedAt existe déjà");
    }
    
    console.log("\n✅ Toutes les colonnes ont été ajoutées avec succès !");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserColumns();

