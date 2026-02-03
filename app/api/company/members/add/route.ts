import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { guardEnterprise } from "@/lib/billing/getPlanContext";
import { createNotification } from "@/lib/notifications/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ajouter un membre à l'entreprise (admin uniquement)
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

    // Guard Enterprise plan
    try {
      await guardEnterprise();
    } catch (error: any) {
      if (error.message?.includes("FORBIDDEN")) {
        return NextResponse.json(
          { error: "Plan Enterprise requis pour ajouter des membres" },
          { status: 403 }
        );
      }
      throw error;
    }

    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est admin de son entreprise
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: {
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            domain: true,
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

    if (!user.isCompanyAdmin) {
      return NextResponse.json(
        { error: "Vous devez être administrateur de l'entreprise pour ajouter des membres" },
        { status: 403 }
      );
    }

    // Vérifier le domaine email si l'entreprise en a un
    if (user.company.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== user.company.domain) {
        return NextResponse.json(
          { error: `L'email doit appartenir au domaine ${user.company.domain}` },
          { status: 400 }
        );
      }
    }

    // Vérifier si l'utilisateur existe
    const targetUser = await (prisma as any).user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        companyId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé. L'utilisateur doit d'abord créer un compte." },
        { status: 404 }
      );
    }

    if (targetUser.companyId) {
      return NextResponse.json(
        { error: "Cet utilisateur fait déjà partie d'une entreprise" },
        { status: 400 }
      );
    }

    // Ajouter l'utilisateur à l'entreprise
    await (prisma as any).user.update({
      where: { id: targetUser.id },
      data: {
        companyId: user.companyId,
      },
    });

    // Notifier le membre ajouté
    try {
      const company = await (prisma as any).company.findUnique({
        where: { id: user.companyId },
        select: { name: true },
      });

      await createNotification({
        userId: targetUser.id,
        kind: "company_member_joined",
        priority: "normal",
        title: "Vous avez rejoint une entreprise",
        body: `Vous avez été ajouté à ${company?.name || "l'entreprise"}`,
        targetUrl: "/app/company",
        dedupeKey: `company_member_added:${user.companyId}:${targetUser.id}`,
      });
    } catch (notifError) {
      console.error("[company/members/add] Erreur lors de la création de la notification:", notifError);
      // Ne pas faire échouer l'ajout si la notification échoue
    }

    return NextResponse.json({
      message: "Membre ajouté avec succès",
      member: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error: any) {
    console.error("[company/members/add] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du membre" },
      { status: 500 }
    );
  }
}

