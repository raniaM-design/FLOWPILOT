import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validation de DATABASE_URL
function validateDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    const errorMessage = 
      "DATABASE_URL n'est pas définie dans les variables d'environnement.\n" +
      "Pour définir DATABASE_URL:\n" +
      "  - Local (SQLite): DATABASE_URL=file:./prisma/dev.db\n" +
      "  - Local (PostgreSQL): DATABASE_URL=postgresql://user:password@host:5432/database?schema=public\n" +
      "  - Vercel: Ajoutez DATABASE_URL dans Settings > Environment Variables";
    console.error("[db] ❌", errorMessage);
    throw new Error(errorMessage);
  }

  // En développement, accepter SQLite (file:./prisma/dev.db)
  const isSqlite = databaseUrl.startsWith("file:");
  const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
  
  if (!isSqlite && !isPostgres) {
    const errorMessage = 
      `DATABASE_URL doit commencer par "postgresql://", "postgres://" ou "file:".\n` +
      `Format actuel: ${databaseUrl.substring(0, 30)}...\n` +
      `Formats acceptés:\n` +
      `  - SQLite (dev): file:./prisma/dev.db\n` +
      `  - PostgreSQL: postgresql://user:password@host:5432/database?schema=public`;
    console.error("[db] ❌", errorMessage);
    throw new Error(errorMessage);
  }

  // En production, forcer PostgreSQL
  if (process.env.NODE_ENV === "production" && isSqlite) {
    const errorMessage = 
      "SQLite n'est pas supporté en production. Utilisez PostgreSQL.\n" +
      "Format attendu: postgresql://user:password@host:5432/database?schema=public";
    console.error("[db] ❌", errorMessage);
    throw new Error(errorMessage);
  }

  // Pour PostgreSQL, vérifier que l'URL est valide
  if (isPostgres) {
    try {
      const url = new URL(databaseUrl);
      if (!url.hostname || !url.pathname) {
        throw new Error("URL invalide");
      }
    } catch (error) {
      const errorMessage = 
        `DATABASE_URL PostgreSQL n'est pas une URL valide.\n` +
        `Format attendu: postgresql://user:password@host:5432/database?schema=public`;
      console.error("[db] ❌", errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Valider DATABASE_URL avant de créer le client Prisma
validateDatabaseUrl();

// Configuration Prisma avec gestion d'erreur améliorée
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === "development" 
    ? (["error", "warn", "query"] as Prisma.LogLevel[])
    : (["error"] as Prisma.LogLevel[]),
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions);

// Tester la connexion au démarrage en développement
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  
  // Test de connexion au démarrage (uniquement en dev pour éviter les problèmes de cold start)
  prisma.$connect().catch((error) => {
    console.error("[db] Erreur de connexion à la base de données:", error);
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      if (databaseUrl.startsWith("file:")) {
        // SQLite
        const dbPath = databaseUrl.replace("file:", "");
        console.error("[db] Chemin SQLite:", dbPath);
        console.error("[db] 💡 Assurez-vous que le répertoire existe et que vous avez les permissions d'écriture");
      } else {
        // PostgreSQL
        try {
          const url = new URL(databaseUrl);
          console.error("[db] Host:", url.hostname);
          console.error("[db] Port:", url.port || "5432 (défaut)");
          console.error("[db] Database:", url.pathname.replace("/", ""));
          console.error("[db] User:", url.username);
        } catch {
          console.error("[db] Format de l'URL invalide");
        }
      }
    }
  });
}

