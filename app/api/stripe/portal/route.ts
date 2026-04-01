import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { getPublicAppUrl, getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "Aucun compte de facturation Stripe" }, { status: 404 });
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getPublicAppUrl()}/app/account/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("[stripe/portal]", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
