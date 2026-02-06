import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

/**
 * GET /api/search
 * Recherche globale dans projets, décisions, actions et réunions
 * Requiert au moins 2 caractères
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() || "";

    // Requiert au moins 2 caractères
    if (query.length < 2) {
      return NextResponse.json({ results: { projects: [], decisions: [], actions: [], meetings: [] } });
    }

    const searchLower = query.toLowerCase();

    // Récupérer les projets accessibles (utilise la fonction qui gère les membres d'entreprise)
    const projectsWhere = await getAccessibleProjectsWhere(userId);
    const userProjects = await prisma.project.findMany({
      where: projectsWhere,
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    const projectIds = userProjects.map((p) => p.id);

    // Recherche dans les projets
    const projects = userProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
    );

    // Recherche dans les décisions (seulement si on a des projets accessibles)
    const decisions = projectIds.length > 0 ? await prisma.decision.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { context: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    }) : [];

    // Recherche dans les actions (seulement si on a des projets accessibles)
    const actions = projectIds.length > 0 ? await prisma.actionItem.findMany({
      where: {
        projectId: { in: projectIds },
        title: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
        decisionId: true,
      },
      take: 10,
    }) : [];

    // Recherche dans les réunions
    const meetings = await prisma.meeting.findMany({
      where: {
        ownerId: userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { raw_notes: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        date: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    // Recherche dans les décisions mentionnées
    const mentionedDecisions = await prisma.decision.findMany({
      where: {
        mentions: {
          some: {
            userId,
          },
        },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { context: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    // Recherche dans les réunions mentionnées
    const mentionedMeetings = await prisma.meeting.findMany({
      where: {
        mentions: {
          some: {
            userId,
          },
        },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { raw_notes: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        date: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    // Combiner et dédupliquer
    const allDecisions = [
      ...decisions,
      ...mentionedDecisions.filter(
        (d) => !decisions.some((dec) => dec.id === d.id)
      ),
    ];

    const allMeetings = [
      ...meetings,
      ...mentionedMeetings.filter(
        (m) => !meetings.some((meet) => meet.id === m.id)
      ),
    ];

    return NextResponse.json({
      results: {
        projects: projects.map((p) => ({
          id: p.id,
          type: "project",
          title: p.name,
          subtitle: p.description || "",
          href: `/app/projects/${p.id}`,
        })),
        decisions: allDecisions.map((d) => ({
          id: d.id,
          type: "decision",
          title: d.title,
          subtitle: d.project.name,
          href: `/app/decisions/${d.id}`,
        })),
        actions: actions.map((a) => ({
          id: a.id,
          type: "action",
          title: a.title,
          subtitle: a.project.name,
          href: a.decisionId
            ? `/app/decisions/${a.decisionId}`
            : `/app/projects/${a.projectId}/kanban`,
        })),
        meetings: allMeetings.map((m) => ({
          id: m.id,
          type: "meeting",
          title: m.title || "Réunion sans titre",
          subtitle: m.project?.name || "",
          href: `/app/meetings/${m.id}`,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Erreur lors de la recherche",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}

