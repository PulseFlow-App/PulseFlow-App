/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { brand } from "@/lib/design-tokens";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: brand.name,
  description:
    "Jobs, bills, vendors and guests in one place. Everyone sees their own part, in their own language.",
  path: "/",
});

/** Logged-out public welcome. Middleware sends signed-in users to /home. */
export default function RootPage() {
  return <WelcomeScreen />;
}
