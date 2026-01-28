import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { ProductRoadmap } from "./product-roadmap";

export default async function ProjectRoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Charger le projet avec ses décisions et actions (avec toutes les données nécessaires pour UrgencyBar)
  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId, // Sécurité : vérifier que le projet appartient à l'utilisateur
    },
    include: {
      decisions: {
        include: {
          actions: {
            select: {
              id: true,
              status: true,
              dueDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProductRoadmap
      projectId={project.id}
      projectName={project.name}
    />
  );
}

