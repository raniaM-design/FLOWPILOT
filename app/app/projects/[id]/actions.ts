"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";

export async function createDecision(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();

  // Validation
  if (!projectId) {
    throw new Error("ID du projet manquant");
  }

  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que le projet appartient à l'utilisateur
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (!project) {
    throw new Error("Projet non trouvé ou accès non autorisé");
  }

  // Créer la décision avec status DRAFT par défaut
  await prisma.decision.create({
    data: {
      title,
      context: context || null,
      decision: decision || null,
      status: "DRAFT",
      projectId,
      createdById: userId,
    },
  });

  redirect(`/app/projects/${projectId}`);
}

export async function createActionItem(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();

  const projectId = String(formData.get("projectId") ?? "");
  const decisionId = String(formData.get("decisionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDateStr = String(formData.get("dueDate") ?? "").trim();

  // Validation
  if (!projectId || !decisionId) {
    throw new Error("ID du projet ou de la décision manquant");
  }

  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que la décision appartient à un projet de l'utilisateur
  const decision = await prisma.decision.findFirst({
    where: {
      id: decisionId,
      project: {
        id: projectId,
        ownerId: userId,
      },
    },
  });

  if (!decision) {
    throw new Error("Décision non trouvée ou accès non autorisé");
  }

  // Parser la date si fournie
  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Date invalide");
    }
  }

  // Créer l'action avec status TODO par défaut
  await prisma.actionItem.create({
    data: {
      title,
      status: "TODO",
      projectId,
      decisionId,
      createdById: userId,
      assigneeId: userId, // V1: assigner à l'utilisateur créateur
      dueDate,
    },
  });

  redirect(`/app/projects/${projectId}`);
}
