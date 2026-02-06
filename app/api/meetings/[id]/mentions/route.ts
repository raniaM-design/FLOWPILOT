import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Mettre à jour les mentions d'une réunion
 * PUT /api/meetings/[id]/mentions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    const body = await request.json();
    const { mentionedUserIds } = body;

    if (!Array.isArray(mentionedUserIds)) {
      return NextResponse.json(
        { error: "mentionedUserIds doit être un tableau" },
        { status: 400 }
      );
    }

    // Vérifier que la réunion appartient à l'utilisateur
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer toutes les mentions existantes
    await prisma.meetingMention.deleteMany({
      where: {
        meetingId: id,
      },
    });

    // Créer les nouvelles mentions
    if (mentionedUserIds.length > 0) {
      await prisma.meetingMention.createMany({
        data: mentionedUserIds.map((userId: string) => ({
          meetingId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // Revalider les pages concernées
    revalidatePath(`/app/meetings/${id}/analyze`);
    revalidatePath("/app/meetings");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des mentions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des mentions" },
      { status: 500 }
    );
  }
}

/**
 * Récupérer les mentions d'une réunion
 * GET /api/meetings/[id]/mentions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    // Vérifier que la réunion appartient à l'utilisateur OU qu'il est mentionné
    const meeting = await (prisma as any).meeting.findFirst({
      where: {
        id,
        OR: [
          {
            ownerId: userId,
          },
          {
            mentions: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée ou accès non autorisé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mentionedUserIds: meeting.mentions.map((m: { userId: string }) => m.userId),
      users: meeting.mentions.map((m: { user: { id: string; email: string; name: string | null } }) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des mentions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mentions" },
      { status: 500 }
    );
  }
}

