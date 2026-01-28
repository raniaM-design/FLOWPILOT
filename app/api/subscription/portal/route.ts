import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";

/**
 * Route API pour créer une session Customer Portal Stripe
 * POST /api/subscription/portal
 */
export async function POST() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // TODO: Intégrer avec Stripe Customer Portal
    // Exemple :
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: stripeCustomerId,
    //   return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/account/subscription`,
    // });
    // return NextResponse.json({ url: session.url });

    // Pour l'instant, retourner une URL placeholder
    return NextResponse.json({
      url: "/app/account/subscription",
      message: "Redirection vers la gestion d'abonnement",
    });
  } catch (error) {
    console.error("Erreur lors de la création de la session portal:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'accès au portail de gestion" },
      { status: 500 }
    );
  }
}

