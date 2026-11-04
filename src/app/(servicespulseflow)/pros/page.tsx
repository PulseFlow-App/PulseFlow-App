"use client";

import { useEffect } from "react";
import { HomeScreen } from "@/components/pros/home-screen";
import { WorkHome } from "@/components/pros/audience-home";
import { isWorkAccount } from "@/lib/pros/intent";
import { releaseAccidentalListing } from "@/lib/pros/join";
import { usePros } from "@/lib/pros/store";

export default function ProsHomePage() {
  const { actor, actorReady } = usePros();
  useEffect(() => {
    releaseAccidentalListing();
  }, []);
  if (!actorReady) return null;
  if (isWorkAccount(actor)) return <WorkHome />;
  return <HomeScreen />;
}
