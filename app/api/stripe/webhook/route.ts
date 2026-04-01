import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, subscriptionTierFromPriceId } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * Webhook Stripe — body brut uniquement (req.text), jamais req.json().
 * Événements gérés :
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - customer.subscription.deleted
 * - invoice.payment_failed
 * - customer.subscription.updated
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Période de facturation (API Stripe récente : sur l’item d’abonnement). */
function periodEndFromSubscription(sub: Stripe.Subscription): Date {
  const end = sub.items?.data?.[0]?.current_period_end;
  if (typeof end === "number") {
    return new Date(end * 1000);
  }
  return new Date();
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (typeof fromParent === "string") return fromParent;
  if (fromParent && typeof fromParent === "object" && "id" in fromParent) {
    return fromParent.id;
  }
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id;
  return undefined;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Configuration webhook incomplète" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "signature";
    console.error("[stripe/webhook] constructEvent:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subscriptionId = session.subscription;
        if (!subscriptionId || typeof subscriptionId !== "string") break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const tier = subscriptionTierFromPriceId(priceId);
        if (tier === "free") break;

        const customerId = session.customer;
        if (!customerId || typeof customerId !== "string") break;

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEndFromSubscription(subscription),
            plan: tier,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const tier = subscriptionTierFromPriceId(priceId);
        if (tier === "free") break;

        const customerId = invoice.customer;
        if (!customerId || typeof customerId !== "string") break;

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEndFromSubscription(subscription),
            plan: tier,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            plan: "free",
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const tier = subscriptionTierFromPriceId(priceId);
        const keepAccess = ["active", "trialing", "past_due"].includes(subscription.status);

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEndFromSubscription(subscription),
            plan: keepAccess && tier !== "free" ? tier : "free",
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer && typeof invoice.customer === "object" && "id" in invoice.customer
              ? invoice.customer.id
              : undefined;
        console.warn("[stripe/webhook] invoice.payment_failed", {
          id: invoice.id,
          customer,
          customerEmail: invoice.customer_email,
          subscription: subscriptionIdFromInvoice(invoice),
          attemptCount: invoice.attempt_count,
        });
        break;
      }

      default: {
        console.log("[stripe/webhook] Événement non traité (ignoré):", event.type);
      }
    }
  } catch (e: unknown) {
    console.error("[stripe/webhook] handler", e);
    const message = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
