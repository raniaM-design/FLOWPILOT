"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import { calendarDayKeyInTz } from "@/lib/standup/calendar";

export async function recordStandupComplete() {
  const userId = await getCurrentUserIdOrThrow();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { standupTimezone: true },
  });
  const tz = user.standupTimezone || "Europe/Paris";
  const calendarDay = calendarDayKeyInTz(new Date(), tz);

  await prisma.standupCompletion.upsert({
    where: {
      userId_calendarDay: { userId, calendarDay },
    },
    create: { userId, calendarDay },
    update: { completedAt: new Date() },
  });

  revalidatePath("/app");
  revalidatePath("/app/standup");
  return { ok: true as const };
}

export async function markStandupActionDone(actionId: string) {
  const userId = await getCurrentUserIdOrThrow();
  const projectsWhere = await getAccessibleProjectsWhere(userId);

  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
      assigneeId: userId,
      status: { not: "DONE" },
      project: projectsWhere,
    },
    select: {
      id: true,
      projectId: true,
      decisionId: true,
    },
  });

  if (!action) {
    throw new Error("Action introuvable ou non autorisée");
  }

  await prisma.actionItem.update({
    where: { id: actionId },
    data: { status: "DONE", blockReason: null },
  });

  if (action.decisionId) {
    revalidatePath(`/app/decisions/${action.decisionId}`);
  }
  revalidatePath(`/app/projects/${action.projectId}`);
  revalidatePath(`/app/projects/${action.projectId}/kanban`);
  revalidatePath(`/app/projects/${action.projectId}/gantt`);
  revalidatePath("/app");
  revalidatePath("/app/actions");
  revalidatePath("/app/calendar");
  revalidatePath("/app/standup");

  return { ok: true as const };
}
