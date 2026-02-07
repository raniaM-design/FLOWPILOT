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

  // Charger le projet avec son propriétaire et ses décisions/actions
  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId, // Sécurité : vérifier que le projet appartient à l'utilisateur
    },
    include: {
      owner: {
        select: {
          email: true,
        },
      },
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

  // Sécurité : n'afficher les données statiques PILOTYS que si :
  // 1. Le projet appartient à l'utilisateur (déjà vérifié ci-dessus)
  // 2. Le propriétaire a un email PILOTYS officiel (@pilotys.io)
  // 3. Le projet s'appelle "PILOTYS"
  const ownerEmail = project.owner.email.toLowerCase();
  const isPilotysOfficialEmail = ownerEmail.endsWith("@pilotys.io");
  const isPilotysProjectName = project.name.toLowerCase().trim() === "pilotys";
  const isPilotysProject = isPilotysOfficialEmail && isPilotysProjectName;

  return (
    <ProductRoadmap
      projectId={project.id}
      projectName={project.name}
      showStaticData={isPilotysProject}
    />
  );
}

