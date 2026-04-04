import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import {
  calendarDayKeyInTz,
  utcEndOfCalendarDay,
  utcStartOfCalendarDay,
} from "@/lib/standup/calendar";

export type StandupPriorityRow = {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  projectId: string;
  projectName: string | null;
  overdue: boolean;
};

export type StandupAttentionDecision = {
  id: string;
  title: string;
  projectName: string | null;
};

function firstNameFromUser(user: {
  name: string | null;
  email: string;
}): string {
  if (user.name?.trim()) {
    return user.name.trim().split(/\s+/)[0] ?? user.name.trim();
  }
  const part = user.email.split("@")[0] ?? "";
  return part ? part.charAt(0).toUpperCase() + part.slice(1).split(".")[0] : "";
}

export async function loadStandupPageData(userId: string, now = new Date()) {
  const projectsWhere = await getAccessibleProjectsWhere(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, standupTimezone: true },
  });

  const tz = user.standupTimezone || "Europe/Paris";
  const todayKey = calendarDayKeyInTz(now, tz);
  const todayStart = utcStartOfCalendarDay(todayKey, tz);
  const todayEnd = utcEndOfCalendarDay(todayKey, tz);

  const [rawActions, attentionDecision] = await Promise.all([
    prisma.actionItem.findMany({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        dueDate: { not: null },
        OR: [
          { dueDate: { lt: todayStart } },
          { dueDate: { gte: todayStart, lte: todayEnd } },
        ],
        project: projectsWhere,
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        projectId: true,
        project: { select: { name: true } },
      },
    }),
    prisma.decision.findFirst({
      where: {
        project: projectsWhere,
        status: { not: "ARCHIVED" },
        actions: { none: {} },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  const overdue = rawActions.filter((a) => a.dueDate! < todayStart);
  const today = rawActions.filter(
    (a) => a.dueDate! >= todayStart && a.dueDate! <= todayEnd,
  );
  overdue.sort(
    (a, b) => a.dueDate!.getTime() - b.dueDate!.getTime(),
  );
  today.sort(
    (a, b) => a.dueDate!.getTime() - b.dueDate!.getTime(),
  );

  const top3 = [...overdue, ...today].slice(0, 3);

  const priorities: StandupPriorityRow[] = top3.map((a) => ({
    id: a.id,
    title: a.title,
    dueDate: a.dueDate!.toISOString(),
    status: a.status,
    projectId: a.projectId,
    projectName: a.project?.name ?? null,
    overdue: a.dueDate! < todayStart,
  }));

  const attention: StandupAttentionDecision | null = attentionDecision
    ? {
        id: attentionDecision.id,
        title: attentionDecision.title,
        projectName: attentionDecision.project?.name ?? null,
      }
    : null;

  return {
    firstName: firstNameFromUser(user),
    priorities,
    attention,
  };
}
