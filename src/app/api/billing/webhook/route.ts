import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import type { SubscriptionStatus } from "@/lib/types";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "none";
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const orgId = sub.metadata?.org_id;
  const admin = createAdminClient();

  const patch = {
    stripe_subscription_id: sub.id,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    subscription_status: mapStatus(sub.status),
  };

  if (orgId) {
    await admin.from("organizations").update(patch).eq("id", orgId);
    return;
  }

  await admin
    .from("organizations")
    .update(patch)
    .eq(
      "stripe_customer_id",
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    );
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET missing" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (orgId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription({
            ...sub,
            metadata: { ...sub.metadata, org_id: orgId },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook handler]", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
