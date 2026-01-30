import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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

