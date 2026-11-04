"use client";

import { useEffect } from "react";
import { HomeScreen } from "@/components/pros/home-screen";
import { releaseAccidentalListing } from "@/lib/pros/join";

export default function ProsHomePage() {
  useEffect(() => {
    releaseAccidentalListing();
  }, []);
  return <HomeScreen />;
}
