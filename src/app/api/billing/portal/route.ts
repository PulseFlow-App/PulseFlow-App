import { NextResponse } from "next/server";

/** Software billing is App Store / Apple IAP oriented. Web billing portal is retired. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Manage software subscriptions in the Apple App Store (Subscriptions) when the iOS app is live. The web billing portal is not available.",
    },
    { status: 503 },
  );
}
