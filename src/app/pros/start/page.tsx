"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServicesMark } from "@/components/brand/services-mark";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { usePros } from "@/lib/pros/store";
import { saveServicesCustomer } from "@/lib/pros/trial";

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function StartForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = usePros();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"create" | "sign-in">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const go = () => {
    router.replace(next);
    router.refresh();
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 6 || (mode === "create" && !name.trim())) {
      setError("Name, email, and a password (6+ characters) are required.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "sign-in") {
        const { createClient } = await import("@/lib/supabase/client");
        const { error: signInError } = await createClient().auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        go();
        return;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email,
          password,
          orgName: `${name.trim().split(" ")[0] || "My"}'s services`,
          kind: "personal",
          track: "management",
          role: "owner",
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        const message = payload.error ?? "Could not create the account.";
        if (/supabase|demo/i.test(message)) {
          saveServicesCustomer({ name, email });
          go();
          return;
        }
        throw new Error(message);
      }
      const { createClient } = await import("@/lib/supabase/client");
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      go();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <ServicesMark className="size-12" />
        <h1 className="font-display text-2xl font-semibold text-ink">{t("trialTitle")}</h1>
      </div>
      <p className="text-sm text-muted">{t("trialBody")}</p>
      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-card p-4">
        {mode === "create" ? (
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-12" />
          </div>
        ) : null}
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="min-h-12" />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "create" ? "new-password" : "current-password"} className="min-h-12" />
        </div>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        <Button className="w-full" busy={saving} onClick={() => void submit()}>
          {mode === "create" ? t("createServicesAccount") : t("signIn")}
        </Button>
        <button
          type="button"
          className="min-h-12 text-sm font-semibold text-primary"
          onClick={() => {
            setMode(mode === "create" ? "sign-in" : "create");
            setError(null);
          }}
        >
          {mode === "create" ? "Already have a Pulse Flow Services account? Sign in" : "Need an account? Create one"}
        </button>
      </div>
    </div>
  );
}

export default function ServicesStartPage() {
  return (
    <Suspense>
      <StartForm />
    </Suspense>
  );
}
