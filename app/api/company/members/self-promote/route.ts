import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Permet à un utilisateur de se promouvoir lui-même en admin d'entreprise
 * (uniquement si aucun admin n'existe encore dans l'entreprise)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur fait partie d'une entreprise
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true,
                isCompanyAdmin: true,
              },
            },
          },
        },
      },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre d'une entreprise" },
        { status: 403 }
      );
    }

    if (user.isCompanyAdmin) {
      return NextResponse.json(
        { error: "Vous êtes déjà administrateur de l'entreprise" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà un admin dans l'entreprise (vérification atomique)
    // Utiliser une transaction pour éviter les race conditions
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Re-vérifier atomiquement qu'il n'y a pas d'admin
      const companyMembers = await tx.user.findMany({
        where: {
          companyId: user.companyId,
        },
        select: {
          id: true,
          isCompanyAdmin: true,
        },
      });

      const hasAdmin = companyMembers.some((m: any) => m.isCompanyAdmin && m.id !== session.userId);
      
      if (hasAdmin) {
        throw new Error("Votre entreprise a déjà un administrateur. Contactez-le pour obtenir les droits d'administration.");
      }

      // Vérifier que l'utilisateur n'est pas déjà admin (double vérification)
      const currentUser = await tx.user.findUnique({
        where: { id: session.userId },
        select: {
          isCompanyAdmin: true,
        },
      });

      if (currentUser?.isCompanyAdmin) {
        throw new Error("Vous êtes déjà administrateur de l'entreprise");
      }

      // Promouvoir l'utilisateur au rôle admin de manière atomique
      const updatedUser = await tx.user.update({
        where: { id: session.userId },
        data: {
          isCompanyAdmin: true,
        },
        select: {
          id: true,
          email: true,
          isCompanyAdmin: true,
        },
      });

      return updatedUser;
    });

    // Notifier l'utilisateur
    try {
      await createNotification({
        userId: session.userId,
        kind: "company_member_promoted",
        priority: "high",
        title: "Vous êtes maintenant administrateur",
        body: `Vous avez été promu administrateur de ${user.company?.name || "votre entreprise"}`,
        targetUrl: "/app/company",
        dedupeKey: `company_self_promoted:${user.companyId}:${session.userId}`,
      });
    } catch (notifError) {
      console.error("[company/members/self-promote] Erreur lors de la création de la notification:", notifError);
    }

    return NextResponse.json({
      message: "Vous avez été promu administrateur de l'entreprise avec succès",
      isCompanyAdmin: true,
    });
  } catch (error: any) {
    console.error("[company/members/self-promote] Erreur:", error);
    
    // Gérer les erreurs spécifiques de la transaction
    if (error.message?.includes("déjà un administrateur") || error.message?.includes("déjà administrateur")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Erreur lors de la promotion" },
      { status: 500 }
    );
  }
}

