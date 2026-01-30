import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validation de DATABASE_URL (seulement au runtime, jamais au build)
function validateDatabaseUrl(): void {
  // Ne pas valider pendant le build (Next.js collecte la config)
  // La validation se fera uniquement au runtime réel
  // Vérifier si on est dans un contexte de build en vérifiant plusieurs conditions
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) ||
    typeof window === 'undefined' && process.env.NEXT_RUNTIME === undefined;
  
  // En fait, validons seulement si DATABASE_URL existe ET qu'on n'est pas en train de builder
  // La meilleure approche : ne valider que si on a vraiment besoin de se connecter
  // Pour l'instant, on skip la validation si on est en build
  if (isBuildTime && process.env.VERCEL === undefined) {
    return; // Skip validation during local build
  }
  
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

  // Nettoyer l'URL (supprimer les espaces, retours à la ligne, etc.)
  const cleanUrl = databaseUrl.trim();
  
  // En développement, accepter SQLite (file:./prisma/dev.db)
  const isSqlite = cleanUrl.startsWith("file:");
  const isPostgres = cleanUrl.startsWith("postgresql://") || cleanUrl.startsWith("postgres://");
  
  if (!isSqlite && !isPostgres) {
    const errorMessage = 
      `DATABASE_URL doit commencer par "postgresql://", "postgres://" ou "file:".\n` +
      `Format actuel: ${cleanUrl.substring(0, 50)}...\n` +
      `Formats acceptés:\n` +
      `  - SQLite (dev): file:./prisma/dev.db\n` +
      `  - PostgreSQL: postgresql://user:password@host:5432/database?schema=public`;
    console.error("[db] ❌", errorMessage);
    throw new Error(errorMessage);
  }

  // En production (Vercel), forcer PostgreSQL
  // Mais permettre SQLite en développement local même lors du build
  const isVercel = process.env.VERCEL === "1";
  if (isVercel && isSqlite) {
    const errorMessage = 
      "SQLite n'est pas supporté sur Vercel. Utilisez PostgreSQL.\n" +
      "Format attendu: postgresql://user:password@host:5432/database?schema=public";
    console.error("[db] ❌", errorMessage);
    throw new Error(errorMessage);
  }

  // Pour PostgreSQL, vérifier que l'URL est valide
  if (isPostgres) {
    try {
      const url = new URL(cleanUrl);
      if (!url.hostname || !url.pathname) {
        throw new Error("URL invalide");
      }
    } catch (error) {
      const errorMessage = 
        `DATABASE_URL PostgreSQL n'est pas une URL valide.\n` +
        `Format attendu: postgresql://user:password@host:5432/database?schema=public\n` +
        `URL reçue: ${cleanUrl.substring(0, 50)}...`;
      console.error("[db] ❌", errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Ne pas valider au moment de l'import du module (peut causer des problèmes au build)
// La validation sera faite lors de la première utilisation de Prisma (lazy validation)

// Configuration Prisma avec gestion d'erreur améliorée
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === "development" 
    ? (["error", "warn", "query"] as Prisma.LogLevel[])
    : (["error"] as Prisma.LogLevel[]),
};

// Créer le client Prisma avec validation lazy
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Valider DATABASE_URL seulement lors de la première utilisation réelle (runtime)
    validateDatabaseUrl();
    globalForPrisma.prisma = new PrismaClient(prismaClientOptions);
  }
  return globalForPrisma.prisma;
}

// Proxy lazy pour éviter la validation au build
// Le client ne sera créé que lors de la première utilisation réelle
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Ne pas tester la connexion au démarrage pour éviter les problèmes au build
// La connexion sera testée lors de la première requête réelle

