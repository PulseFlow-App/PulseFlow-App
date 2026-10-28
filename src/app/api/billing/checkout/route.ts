import { NextResponse } from "next/server";

/** Software billing is App Store / Apple IAP oriented. Web card checkout is retired. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Software subscriptions are handled through the Apple App Store when the iOS app is live. In-app web checkout is not available.",
    },
    { status: 503 },
  );
}
