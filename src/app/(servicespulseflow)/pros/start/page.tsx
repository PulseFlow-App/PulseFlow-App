"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { usePros } from "@/lib/pros/store";
import { LegalAccept } from "@/components/pros/legal-accept";
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
  const [mode, setMode] = useState<"create" | "sign-in">(
    params.get("mode") === "sign-in" ? "sign-in" : "create",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emails, setEmails] = useState(false);

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
    if (mode === "create" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "create" && !accepted) {
      setError(t("legalNeedScroll"));
      return;
    }
    const termsAcceptedAt = new Date().toISOString();
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
          servicesIntent: "hire",
          termsAcceptedAt,
          emailOptIn: emails,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        const message = payload.error ?? "Could not create the account.";
        if (/supabase|demo/i.test(message)) {
          saveServicesCustomer({ name, email, termsAcceptedAt, emailOptIn: emails });
          go();
          return;
        }
        if (!/already been registered|already registered|already exists/i.test(message)) {
          throw new Error(message);
        }
      }
      const { createClient } = await import("@/lib/supabase/client");
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        throw new Error(
          /already been registered|already registered|already exists/i.test(payload.error ?? "")
            ? t("existingAccountPassword")
            : signInError.message,
        );
      }
      go();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <Link href="/" className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
        {t("home")}
      </Link>
      <div className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        {mode === "create" ? (
          <div>
            <Label>{t("yourName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        ) : null}
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "create" ? "new-password" : "current-password"} />
        </div>
        {mode === "create" ? (
          <div>
            <Label>{t("passwordAgain")}</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        ) : null}
        {mode === "create" ? (
          <LegalAccept audience="customer" accepted={accepted} onAccepted={setAccepted} emails={emails} onEmails={setEmails} />
        ) : null}
        {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            className="min-h-12 w-full"
            disabled={mode === "create" && !accepted}
            busy={saving && mode === "create"}
            reflectGlobalBusy={false}
            onClick={() => {
              if (mode !== "create") {
                setMode("create");
                setError(null);
                return;
              }
              void submit();
            }}
          >
            {t("signUp")}
          </Button>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-50"
            disabled={saving && mode === "sign-in"}
            onClick={() => {
              if (mode !== "sign-in") {
                setMode("sign-in");
                setError(null);
                return;
              }
              void submit();
            }}
          >
            {t("signIn")}
          </button>
        </div>
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
