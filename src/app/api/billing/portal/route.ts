import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/billing/stripe";
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

  if (!org?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer yet. Start a subscription first." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl()}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
