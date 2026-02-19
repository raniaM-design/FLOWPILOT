import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { notFound } from "next/navigation";
import { canAccessProject } from "@/lib/company/getCompanyProjects";
import { ProjectGantt } from "./project-gantt";

export default async function ProjectGanttPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();
  const { id } = await params;

  const hasAccess = await canAccessProject(userId, id);
  if (!hasAccess) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: { id },
    include: {
      actions: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        include: {
          assignee: {
            select: { name: true, email: true },
          },
          decision: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectGantt
      projectId={project.id}
      projectName={project.name}
      actions={project.actions.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        createdAt: a.createdAt,
        dueDate: a.dueDate,
        assigneeName: a.assignee?.name ?? a.assignee?.email ?? null,
        decisionTitle: a.decision?.title ?? null,
      }))}
    />
  );
}
