import { randomBytes } from "crypto";
import { hashPassword } from "./password";
import { prisma } from "@/lib/db";

/**
 * Génère un token sécurisé pour la réinitialisation de mot de passe
 * Retourne le token en clair (à envoyer par email) et son hash (à stocker en DB)
 */
export async function generatePasswordResetToken(): Promise<{
  token: string;
  tokenHash: string;
}> {
  // Générer un token aléatoire de 32 bytes (256 bits)
  const token = randomBytes(32).toString("hex");
  
  // Hasher le token avant de le stocker (comme un mot de passe)
  const tokenHash = await hashPassword(token);
  
  return { token, tokenHash };
}

/**
 * Vérifie qu'un token de réinitialisation est valide
 * Retourne le token DB si valide, null sinon
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ id: string; userId: string } | null> {
  // Récupérer tous les tokens non expirés et non utilisés
  // Note: Le client Prisma sera régénéré après la migration
  const tokens = await (prisma as any).passwordResetToken.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      usedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  // Vérifier chaque token avec bcrypt.compare
  for (const tokenRecord of tokens) {
    const isValid = await import("bcryptjs").then((bcrypt) =>
      bcrypt.default.compare(token, tokenRecord.tokenHash)
    );
    
    if (isValid) {
      return {
        id: tokenRecord.id,
        userId: tokenRecord.userId,
      };
    }
  }

  return null;
}

/**
 * Marque un token comme utilisé
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await (prisma as any).passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

/**
 * Supprime les tokens expirés (nettoyage)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await (prisma as any).passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

