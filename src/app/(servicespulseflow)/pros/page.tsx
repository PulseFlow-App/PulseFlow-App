"use client";

import { useEffect } from "react";
import { HomeScreen } from "@/components/pros/home-screen";
import { ServicesWelcome, WorkHome } from "@/components/pros/audience-home";
import { isHireAccount, isWorkAccount } from "@/lib/pros/intent";
import { releaseAccidentalListing } from "@/lib/pros/join";
import { usePros } from "@/lib/pros/store";

export default function ProsHomePage() {
  const { actor, actorReady } = usePros();
  useEffect(() => {
    releaseAccidentalListing();
  }, []);
  if (!actorReady) return <ServicesWelcome />;
  if (isWorkAccount(actor)) return <WorkHome />;
  if (isHireAccount(actor)) return <HomeScreen />;
  return <ServicesWelcome />;
}
