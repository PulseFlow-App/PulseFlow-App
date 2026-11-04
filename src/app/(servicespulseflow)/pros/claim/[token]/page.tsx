"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePros } from "@/lib/pros/store";

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const { state, ready, t, claim } = usePros();
  const pro = state.profiles.find((row) => row.claimToken === params.token);
  const [done, setDone] = useState(false);
  if (!ready) return null;
  if (!pro) {
    return (
      <div className="space-y-3">
        <Link href="/" className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
          {t("home")}
        </Link>
        <p className="text-pf-14 text-pf-text-secondary">{t("claimMissing")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
        {t("home")}
      </Link>
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{pro.name}</h1>
      <p className="text-pf-16 text-pf-ink">{pro.description}</p>
      {done || pro.claimedAt ? (
        <p className="text-pf-14 font-medium text-pf-ink">{t("claimed")}</p>
      ) : (
        <Button
          type="button"
          className="min-h-12 w-full"
          reflectGlobalBusy={false}
          onClick={() => {
            if (claim(params.token)) setDone(true);
          }}
        >
          {t("claim")}
        </Button>
      )}
    </div>
  );
}
