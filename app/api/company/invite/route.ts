import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import { guardEnterprise } from "@/lib/billing/getPlanContext";
import { sendCompanyInvitationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inviter quelqu'un par email à rejoindre l'entreprise
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
          { error: "Plan Enterprise requis pour inviter des membres" },
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

    const emailLower = email.trim().toLowerCase();

    // Vérifier que l'utilisateur est admin de son entreprise
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
            domain: true,
            members: {
              select: {
                email: true,
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

    if (!user.isCompanyAdmin) {
      return NextResponse.json(
        { error: "Vous devez être administrateur de l'entreprise pour inviter des membres" },
        { status: 403 }
      );
    }

    // Vérifier le domaine email si l'entreprise en a un et qu'il est valide
    if (user.company.domain) {
      // Vérifier que le domaine est un vrai domaine email (contient un point)
      const isValidDomain = user.company.domain.includes(".") && !user.company.domain.includes(" ");
      
      if (isValidDomain) {
        const emailDomain = emailLower.split("@")[1];
        const companyDomain = user.company.domain.toLowerCase().trim();
        
        if (!emailDomain || emailDomain !== companyDomain) {
          return NextResponse.json(
            { error: `L'email doit appartenir au domaine ${user.company.domain}` },
            { status: 400 }
          );
        }
      }
      // Si le domaine n'est pas valide (comme "Mon entreprise"), ignorer la validation
    }

    // Vérifier si l'utilisateur est déjà membre
    const isAlreadyMember = user.company.members.some(
      (m: { email: string }) => m.email.toLowerCase() === emailLower
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre de l'entreprise" },
        { status: 400 }
      );
    }

    // Vérifier si une invitation existe déjà et est encore valide
    const existingInvitation = await (prisma as any).companyInvitation.findFirst({
      where: {
        companyId: user.companyId,
        email: emailLower,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Une invitation est déjà en cours pour cet email" },
        { status: 400 }
      );
    }

    // Générer un token sécurisé
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Date d'expiration : 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer l'invitation
    await (prisma as any).companyInvitation.create({
      data: {
        companyId: user.companyId,
        email: emailLower,
        inviterId: session.userId,
        tokenHash,
        expiresAt,
        status: "PENDING",
      },
    });

    // Envoyer l'email d'invitation
    try {
      await sendCompanyInvitationEmail(
        emailLower,
        user.company.name,
        user.email,
        token
      );
    } catch (emailError: any) {
      console.error("[company/invite] Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas faire échouer la création de l'invitation si l'email échoue
      // L'invitation existe, l'utilisateur pourra la réenvoyer
      return NextResponse.json(
        { 
          error: "Invitation créée mais l'email n'a pas pu être envoyé. Vous pouvez réessayer plus tard.",
          invitationCreated: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation envoyée avec succès",
    });
  } catch (error: any) {
    console.error("[company/invite] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    );
  }
}

