/**
 * Script pour vérifier les colonnes de la table User
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserColumns() {
  try {
    console.log("🔍 Vérification des colonnes de la table User...\n");
    
    // Vérifier si updatedAt existe
    const result = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      ORDER BY column_name;
    `;
    
    console.log("📋 Colonnes trouvées dans la table User:");
    result.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    const hasUpdatedAt = result.some(col => col.column_name === "updatedAt");
    const hasAvatarUrl = result.some(col => col.column_name === "avatarUrl");
    
    console.log("\n✅ Résultat:");
    console.log(`  - updatedAt: ${hasUpdatedAt ? "✅ Existe" : "❌ MANQUANT"}`);
    console.log(`  - avatarUrl: ${hasAvatarUrl ? "✅ Existe" : "❌ MANQUANT"}`);
    
    if (!hasUpdatedAt || !hasAvatarUrl) {
      console.log("\n💡 Solution: Ajouter les colonnes manquantes");
      console.log("   Exécutez: npm run fix-user-columns");
      process.exit(1);
    }
    
    console.log("\n✅ Toutes les colonnes sont présentes !");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserColumns();

