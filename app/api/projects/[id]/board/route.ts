/**
 * API Board - GET / PUT
 * Récupère et sauvegarde l'état du tableau blanc (tldraw) par projet.
 * Utilise canAccessProject pour les projets d'entreprise.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

/**
 * GET /api/projects/[id]/board
 * Récupère le board du projet (données tldraw sauvegardées)
 * Retourne null si aucun board n'existe encore
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id: projectId } = await params;

    const hasAccess = await canAccessProject(userId, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const board = await prisma.board.findUnique({
      where: { projectId },
    });

    // Si pas de board, on retourne null (le client créera un canvas vide)
    if (!board) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: board.data as object });
  } catch (error) {
    console.error("[Board GET] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du board" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/board
 * Sauvegarde ou met à jour le board du projet
 * Body: { data: object } — snapshot document tldraw
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id: projectId } = await params;

    const hasAccess = await canAccessProject(userId, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Le champ 'data' (object) est requis" },
        { status: 400 }
      );
    }

    // Upsert : crée si absent, met à jour si présent
    const board = await prisma.board.upsert({
      where: { projectId },
      create: {
        projectId,
        data: data as object,
      },
      update: {
        data: data as object,
      },
    });

    return NextResponse.json({
      success: true,
      updatedAt: board.updatedAt,
    });
  } catch (error) {
    console.error("[Board PUT] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du board" },
      { status: 500 }
    );
  }
}
