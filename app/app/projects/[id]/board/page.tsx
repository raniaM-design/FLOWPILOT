import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { notFound } from "next/navigation";
import { canAccessProject } from "@/lib/company/getCompanyProjects";
import { ProjectBoard } from "./project-board";

export default async function ProjectBoardPage({
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
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectBoard
      projectId={project.id}
      projectName={project.name}
    />
  );
}
