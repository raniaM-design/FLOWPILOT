import { prisma } from "@/lib/db";

/**
 * Récupère les réunions accessibles à l'utilisateur :
 * - Réunions créées par l'utilisateur
 * - OU réunions où l'utilisateur est mentionné
 */
export async function getMeetingsWithMentions(userId: string) {
  // Récupérer les IDs des réunions où l'utilisateur est mentionné
  const mentionedMeetingIds = await (prisma as any).meetingMention.findMany({
    where: {
      userId,
    },
    select: {
      meetingId: true,
    },
  }).then((mentions: any[]) => mentions.map((m) => m.meetingId));

  // Récupérer les réunions :
  // 1. Réunions créées par l'utilisateur
  // 2. OU réunions où l'utilisateur est mentionné
  const meetings = await (prisma as any).meeting.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        ...(mentionedMeetingIds.length > 0
          ? [
              {
                id: {
                  in: mentionedMeetingIds,
                },
              },
            ]
          : []),
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          decision: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return meetings;
}

