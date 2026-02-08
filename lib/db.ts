import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnected: boolean;
};

// Validation simplifiée - seulement un warning, pas d'erreur au build
// Prisma gérera les erreurs de connexion au runtime
function validateDatabaseUrl(): void {
  // Ne jamais valider pendant le build - cela cause des erreurs sur Vercel
  // La validation se fera uniquement au runtime réel lors de la première requête
  return; // Skip all validation - let Prisma handle connection errors
}

// Ne pas valider au moment de l'import du module (peut causer des problèmes au build)
// La validation sera faite lors de la première utilisation de Prisma (lazy validation)

// Fonction pour obtenir les options Prisma (évite l'accès à process.env au niveau du module)
function getPrismaClientOptions(): Prisma.PrismaClientOptions {
  // Lire NODE_ENV au runtime, pas au moment de l'import
  const nodeEnv = typeof process !== "undefined" && process.env ? process.env.NODE_ENV : "production";
  return {
    log: nodeEnv === "development" 
      ? (["error", "warn", "query"] as Prisma.LogLevel[])
      : (["error"] as Prisma.LogLevel[]),
  };
}

// Créer le client Prisma avec validation lazy
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Valider DATABASE_URL seulement lors de la première utilisation réelle (runtime)
    validateDatabaseUrl();
    
    // Détecter le provider depuis DATABASE_URL pour override si nécessaire
    const databaseUrl = process.env.DATABASE_URL || "";
    const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
    const isSqlite = databaseUrl.startsWith("file:");
    
    // Si on est en production avec PostgreSQL mais que le schéma est SQLite,
    // utiliser datasources override pour forcer PostgreSQL
    const finalOptions: Prisma.PrismaClientOptions = { ...getPrismaClientOptions() };
    
    if (isPostgres && !isSqlite) {
      // Override le datasource pour utiliser PostgreSQL même si le schéma dit SQLite
      finalOptions.datasources = {
        db: {
          url: databaseUrl,
        },
      };
    }
    
    globalForPrisma.prisma = new PrismaClient(finalOptions);
    globalForPrisma.prismaConnected = false;
  }
  return globalForPrisma.prisma;
}

/**
 * Établit une connexion à la base de données avec retries pour gérer les cold starts
 * (notamment pour Neon qui peut être en veille)
 * 
 * Note: Cette fonction établit seulement la connexion. Les erreurs de schéma seront
 * détectées naturellement lors des vraies requêtes Prisma.
 */
export async function ensurePrismaConnection(maxRetries: number = 3): Promise<void> {
  const client = getPrismaClient();
  
  // Si déjà connecté, ne rien faire
  if (globalForPrisma.prismaConnected) {
    return;
  }
  
  // Vérifier que DATABASE_URL est définie
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL n'est pas définie");
    (error as any).code = "MISSING_DATABASE_URL";
    throw error;
  }
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Établir la connexion avec timeout
      await Promise.race([
        client.$connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 10000)
        ),
      ]);
      
      // Connexion réussie
      globalForPrisma.prismaConnected = true;
      return;
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.code;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Erreurs non récupérables (ne pas réessayer)
      if (
        errorCode === "P1000" || // Authentication failed
        errorCode === "P1003" || // Database does not exist
        errorCode === "MISSING_DATABASE_URL"
      ) {
        throw error;
      }
      
      // Erreurs récupérables (peuvent être réessayées) - notamment P1001 pour cold starts Neon
      if (
        (errorCode === "P1001" || // Can't reach database
         errorMessage.includes("Can't reach database") || 
         errorMessage.includes("ECONNREFUSED") ||
         errorMessage === "TIMEOUT") &&
        attempt < maxRetries
      ) {
        const delay = Math.min(1000 * (attempt + 1), 3000); // Délai progressif jusqu'à 3s
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Réinitialiser la connexion Prisma
        try {
          await client.$disconnect();
          globalForPrisma.prismaConnected = false;
        } catch (e) {
          // Ignorer les erreurs de déconnexion
        }
        continue;
      }
      
      // Si ce n'est pas une erreur récupérable ou qu'on a épuisé les tentatives, propager l'erreur
      throw error;
    }
  }
  
  // Si on arrive ici, toutes les tentatives ont échoué
  throw lastError;
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

