import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import { getPublicAppUrl } from "@/lib/public-app-url";
import type { DailyDigestEmailPayload, DigestEmailActionLine, WeeklyDigestEmailPayload } from "@/lib/email";
import {
  addCalendarDays,
  calendarDayKeyInTz,
  utcStartOfCalendarDay,
  utcEndOfCalendarDay,
  gregorianMinusOneDay,
  weekRangeFromDayKey,
} from "@/lib/standup/calendar";

function line(
  title: string,
  projectName: string,
  path: string,
): DigestEmailActionLine {
  const base = getPublicAppUrl().replace(/\/$/, "");
  return {
    title,
    projectName,
    href: `${base}${path}`,
  };
}

export async function buildDailyDigestForUser(
  userId: string,
  now: Date,
  timeZone: string,
): Promise<{
  openCount: number;
  payload: DailyDigestEmailPayload;
}> {
  const projectsWhere = await getAccessibleProjectsWhere(userId);
  const todayKey = calendarDayKeyInTz(now, timeZone);
  const yesterdayKey = gregorianMinusOneDay(todayKey);
  const todayStart = utcStartOfCalendarDay(todayKey, timeZone);
  const { sundayKey } = weekRangeFromDayKey(todayKey, timeZone);
  const weekEnd = utcEndOfCalendarDay(sundayKey, timeZone);

  const baseSelect = {
    id: true,
    title: true,
    dueDate: true,
    project: { select: { name: true } },
    decision: { select: { id: true } },
  } as const;

  const overdueRaw = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
      dueDate: { lt: todayStart },
      project: projectsWhere,
    },
    select: baseSelect,
    orderBy: { dueDate: "asc" },
    take: 30,
  });

  const thisWeekRaw = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
      project: projectsWhere,
      OR: [
        { dueDate: null },
        { dueDate: { gte: todayStart, lte: weekEnd } },
      ],
    },
    select: baseSelect,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
    take: 40,
  });

  const overdueIds = new Set(overdueRaw.map((a) => a.id));
  const thisWeekFiltered = thisWeekRaw.filter((a) => !overdueIds.has(a.id));

  const yesterdayStart = utcStartOfCalendarDay(yesterdayKey, timeZone);
  const yesterdayEnd = utcEndOfCalendarDay(yesterdayKey, timeZone);

  const doneYesterdayRaw = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "DONE",
      updatedAt: { gte: yesterdayStart, lte: yesterdayEnd },
      project: projectsWhere,
    },
    select: baseSelect,
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const decisionNoAction = await prisma.decision.findFirst({
    where: {
      project: projectsWhere,
      status: "DECIDED",
      actions: { none: {} },
    },
    select: {
      id: true,
      title: true,
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const toLine = (a: {
    title: string;
    project: { name: string };
    decision: { id: string } | null;
  }): DigestEmailActionLine =>
    line(
      a.title,
      a.project.name,
      a.decision ? `/app/decisions/${a.decision.id}` : "/app/actions",
    );

  const payload: DailyDigestEmailPayload = {
    overdue: overdueRaw.map(toLine),
    thisWeek: thisWeekFiltered.map(toLine),
    doneYesterday: doneYesterdayRaw.map(toLine),
    decisionWithoutAction: decisionNoAction
      ? {
          title: decisionNoAction.title,
          projectName: decisionNoAction.project.name,
          href: `${getPublicAppUrl().replace(/\/$/, "")}/app/decisions/${decisionNoAction.id}`,
        }
      : null,
  };

  const openCount = overdueRaw.length + thisWeekFiltered.length;

  return { openCount, payload };
}

export async function buildWeeklyDigestForUser(
  userId: string,
  now: Date,
  timeZone: string,
): Promise<WeeklyDigestEmailPayload> {
  const projectsWhere = await getAccessibleProjectsWhere(userId);
  const todayKey = calendarDayKeyInTz(now, timeZone);
  const { mondayKey } = weekRangeFromDayKey(todayKey, timeZone);
  const lastWeekMonday = addCalendarDays(mondayKey, -7);
  const lastWeekSunday = addCalendarDays(mondayKey, -1);
  const lastStart = utcStartOfCalendarDay(lastWeekMonday, timeZone);
  const lastEnd = utcEndOfCalendarDay(lastWeekSunday, timeZone);

  const lastWeekDoneCount = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: "DONE",
      updatedAt: { gte: lastStart, lte: lastEnd },
      project: projectsWhere,
    },
  });

  const lastWeekHighlights = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "DONE",
      updatedAt: { gte: lastStart, lte: lastEnd },
      project: projectsWhere,
    },
    select: {
      title: true,
      project: { select: { name: true } },
      decision: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const { mondayKey: thisMon, sundayKey: thisSun } = weekRangeFromDayKey(todayKey, timeZone);
  const thisWeekStart = utcStartOfCalendarDay(thisMon, timeZone);
  const thisWeekEnd = utcEndOfCalendarDay(thisSun, timeZone);

  const upcomingPriorities = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
      priority: "high",
      project: projectsWhere,
      OR: [
        { dueDate: null },
        { dueDate: { gte: thisWeekStart, lte: thisWeekEnd } },
      ],
    },
    select: {
      title: true,
      project: { select: { name: true } },
      decision: { select: { id: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
    take: 8,
  });

  const toLine = (a: {
    title: string;
    project: { name: string };
    decision: { id: string } | null;
  }): DigestEmailActionLine =>
    line(
      a.title,
      a.project.name,
      a.decision ? `/app/decisions/${a.decision.id}` : "/app/actions",
    );

  return {
    lastWeekDoneCount,
    lastWeekHighlights: lastWeekHighlights.map(toLine),
    upcomingPriorities: upcomingPriorities.map(toLine),
  };
}
