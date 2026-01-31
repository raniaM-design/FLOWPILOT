import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import MessageDetail from "@/components/messages/message-detail";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté"));
  }

  const { id } = await params;

  // Vérifier que le message appartient à l'utilisateur
  const message = await (prisma as any).message.findUnique({
    where: { id },
  });

  if (!message) {
    redirect("/messages?error=" + encodeURIComponent("Message non trouvé"));
  }

  if (message.userId !== session.userId) {
    redirect("/messages?error=" + encodeURIComponent("Accès refusé"));
  }

  // Marquer comme lu si ce n'est pas déjà fait
  let readAtDate: Date | null = null;
  if (!message.isRead) {
    readAtDate = new Date();
    await (prisma as any).message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: readAtDate,
      },
    });
  }

  // Convertir les dates en strings pour le composant client
  const messageForClient = {
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAt: (message.readAt || readAtDate)?.toISOString() || null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <MessageDetail message={messageForClient} />
      </div>
    </div>
  );
}

