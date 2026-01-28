import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";

/**
 * Route API pour annuler l'abonnement
 * POST /api/subscription/cancel
 */
export async function POST() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // TODO: Intégrer avec Stripe pour annuler l'abonnement
    // Pour l'instant, retourner un succès
    // Exemple avec Stripe :
    // const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    //   cancel_at_period_end: true,
    // });

    return NextResponse.json({
      success: true,
      message: "Abonnement annulé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}

