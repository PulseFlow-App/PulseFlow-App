"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePros } from "@/lib/pros/store";

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const { state, ready, t, claim } = usePros();
  const pro = state.profiles.find((row) => row.claimToken === params.token);
  const [done, setDone] = useState(false);
  if (!ready) return null;
  if (!pro) return <p className="text-sm text-muted">{t("claimMissing")}</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">{pro.name}</h1>
      <p className="text-sm text-ink">{pro.description}</p>
      {done || pro.claimedAt ? (
        <p className="text-sm font-semibold text-ink">{t("claimed")}</p>
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
