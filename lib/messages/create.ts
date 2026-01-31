/**
 * Service pour créer des messages
 */

import { prisma } from "@/lib/db";

export type MessageType = "ai_summary" | "product_announcement" | "team_message";

export interface CreateMessageParams {
  userId: string;
  type: MessageType;
  subject: string;
  content: string; // Markdown ou texte
}

/**
 * Crée un message pour un utilisateur
 */
export async function createMessage({
  userId,
  type,
  subject,
  content,
}: CreateMessageParams): Promise<{ id: string }> {
  const message = await prisma.message.create({
    data: {
      userId,
      type,
      subject,
      content,
    },
  });

  return { id: message.id };
}

