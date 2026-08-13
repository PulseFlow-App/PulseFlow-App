import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  appUrl,
  companyPriceId,
  getStripe,
  isStripeConfigured,
} from "@/lib/billing/stripe";
import { isDemoMode } from "@/lib/env";

export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Billing is unavailable in demo mode." },
      { status: 400 },
    );
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this environment." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json(
      { error: "Only the company owner can manage billing." },
      { status: 403 },
    );
  }

  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single();

  if (!org || org.kind !== "company") {
    return NextResponse.json(
      { error: "Billing applies to company organizations only." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let customerId = org.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.billing_email || profile.email || user.email || undefined,
      name: org.name,
      metadata: { org_id: org.id, owner_id: profile.id },
    });
    customerId = customer.id;
    await admin
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: companyPriceId(), quantity: 1 }],
    success_url: `${appUrl()}/settings?billing=success`,
    cancel_url: `${appUrl()}/settings?billing=cancel`,
    metadata: { org_id: org.id },
    subscription_data: {
      metadata: { org_id: org.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
