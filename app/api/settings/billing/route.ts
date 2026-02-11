import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const body = await request.json();
    const {
      companyName,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      country,
      vatNumber,
    } = body;

    // Vérifier si une entrée existe déjà
    const existing = await prisma.billingInfo.findUnique({
      where: { userId },
    });

    if (existing) {
      // Mettre à jour
      await prisma.billingInfo.update({
        where: { userId },
        data: {
          companyName: companyName || null,
          firstName: firstName || null,
          lastName: lastName || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || null,
          vatNumber: vatNumber || null,
        },
      });
    } else {
      // Créer
      await prisma.billingInfo.create({
        data: {
          userId,
          companyName: companyName || null,
          firstName: firstName || null,
          lastName: lastName || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || null,
          vatNumber: vatNumber || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/settings/billing] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

