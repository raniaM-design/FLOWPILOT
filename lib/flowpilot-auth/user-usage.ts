import { prisma } from "@/lib/db";

export async function getUserUsageStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      preferredLanguage: true,
      createdAt: true,
      companyId: true,
      _count: {
        select: {
          projects: true,
          createdDecisions: true,
          createdActions: true,
          meetings: true,
        },
      },
    },
  });

  if (!user) return null;

  const [
    meetingsThisMonth,
    pageViewsLast30Days,
    pageViewsByPath,
    lastPageView,
    transcriptionsThisMonth,
    reportsThisMonth,
    companyMembers,
    actionsCompletedLast30Days,
    projectsCreatedLast30Days,
  ] = await Promise.all([
    prisma.meeting.count({
      where: { ownerId: userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.pageView.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.pageView.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, path: true },
    }),
    prisma.meetingTranscriptionJob.findMany({
      where: {
        meeting: { ownerId: userId },
        createdAt: { gte: startOfMonth },
        deletedAt: null,
        status: "done",
      },
      select: { transcribedText: true },
    }),
    prisma.meeting.count({
      where: {
        ownerId: userId,
        raw_notes: { not: { equals: "" } },
        createdAt: { gte: startOfMonth },
      },
    }),
    user.companyId
      ? prisma.user.count({ where: { companyId: user.companyId } })
      : Promise.resolve(0),
    prisma.actionItem.count({
      where: {
        createdById: userId,
        status: "DONE",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.project.count({
      where: { ownerId: userId, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const totalMinutesTranscribed = transcriptionsThisMonth.reduce((total, job) => {
    if (!job.transcribedText) return total;
    const wordCount = job.transcribedText.split(/\s+/).length;
    return total + Math.ceil(wordCount / 150);
  }, 0);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      hasCompany: !!user.companyId,
    },
    totals: user._count,
    thisMonth: {
      meetings: meetingsThisMonth,
      transcriptions: transcriptionsThisMonth.length,
      minutesTranscribed: totalMinutesTranscribed,
      reports: reportsThisMonth,
      companyMembers,
    },
    last30Days: {
      pageViews: pageViewsLast30Days,
      actionsCompleted: actionsCompletedLast30Days,
      projectsCreated: projectsCreatedLast30Days,
      topPages: pageViewsByPath
        .map((p) => ({
          path: p.path,
          count: p._count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    },
    lastActivity: lastPageView
      ? { at: lastPageView.createdAt, path: lastPageView.path }
      : null,
  };
}
