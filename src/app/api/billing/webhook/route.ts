import { NextResponse } from "next/server";

/** Legacy web payment webhooks are retired. Entitlements will sync from App Store / StoreKit. */
export async function POST() {
  return NextResponse.json(
    { error: "Web payment webhooks are disabled." },
    { status: 410 },
  );
}
