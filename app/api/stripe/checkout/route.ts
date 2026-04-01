import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import {
  getPriceIdForPlan,
  getPublicAppUrl,
  getStripe,
  isConfiguredPlanKey,
  PRICE_IDS,
  type PlanKey,
} from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    console.log("[stripe/checkout] userId (cookie session):", userId ?? "(non connecté)");

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await req.json()) as { planKey?: string };
    const planKey = body.planKey;
    console.log("[stripe/checkout] planKey reçu:", planKey);
    console.log(
      "[stripe/checkout] PRICE_IDS[planKey] (brut env):",
      planKey && isConfiguredPlanKey(planKey) ? PRICE_IDS[planKey] || "(vide)" : "(clé invalide)"
    );

    if (!planKey || !isConfiguredPlanKey(planKey)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(planKey);
    console.log("[stripe/checkout] Price ID résolu:", priceId ?? "(aucun)");
    if (!priceId) {
      return NextResponse.json(
        { error: "Prix Stripe non configuré (variable STRIPE_PRICE_* manquante)" },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const base = getPublicAppUrl();
    try {
      new URL(base);
    } catch {
      console.error("[stripe/checkout] URL publique invalide (NEXT_PUBLIC_URL / APP_URL):", base);
      return NextResponse.json(
        {
          error:
            "URL publique invalide — corrigez NEXT_PUBLIC_URL ou NEXT_PUBLIC_APP_URL (ex. https://pilotys.io ou http://localhost:3000)",
        },
        { status: 500 }
      );
    }
    console.log("[stripe/checkout] base URL (success/cancel):", base);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    console.log("[stripe/checkout] Session utilisateur (équivalent email):", user.email);

    if (user.stripeSubscriptionId && user.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${base}/app/account/subscription`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    console.log("[stripe/checkout] Création Checkout session…");
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/app?success=true&plan=${encodeURIComponent(planKey)}`,
      cancel_url: `${base}/pricing?canceled=true`,
      subscription_data: {
        metadata: { userId: user.id, planKey: planKey as PlanKey },
      },
      locale: "fr",
      allow_promotion_codes: true,
    });

    const redirectUrl = checkoutSession.url;
    console.log("[stripe/checkout] URL Checkout:", redirectUrl ?? "(null — anormal)");
    return NextResponse.json({ url: redirectUrl });
  } catch (error: unknown) {
    console.error("[stripe/checkout]", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
