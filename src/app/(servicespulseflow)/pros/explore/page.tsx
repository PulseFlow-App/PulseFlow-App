"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HomeScreen } from "@/components/pros/home-screen";
import { isWorkAccount } from "@/lib/pros/intent";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

/** Browse the marketplace before creating an account. Staff keep their work home. */
export default function ExplorePage() {
  const { actor, actorReady } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const work = isWorkAccount(actor);

  useEffect(() => {
    if (!actorReady || !work) return;
    router.replace(servicesPath(pathname, "/"));
  }, [actorReady, pathname, router, work]);

  if (!actorReady || work) return null;
  return <HomeScreen />;
}
