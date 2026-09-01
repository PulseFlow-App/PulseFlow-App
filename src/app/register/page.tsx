"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, UserRound } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { OrgKind } from "@/lib/design-tokens";
import { isDemoMode } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import {
  REFERRAL_STORAGE_KEY,
  readReferralParam,
  rememberReferralCode,
} from "@/lib/billing/plans";
import { DEMO_READ_ONLY_MESSAGE } from "@/lib/demo/guard";

type Step = "use" | "details";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("use");
  const [useKind, setUseKind] = useState<OrgKind | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = readReferralParam(
      new URLSearchParams(window.location.search),
    );
    if (fromQuery) {
      rememberReferralCode(fromQuery);
      setReferralCode(fromQuery);
      return;
    }
    setReferralCode(localStorage.getItem(REFERRAL_STORAGE_KEY));
  }, []);

  const title = useMemo(() => {
    if (step === "use") return "How will you use PulseFlow?";
    if (useKind === "company") return "Create your company";
    return "Set up your property workspace";
  }, [step, useKind]);

  const continueFromUse = () => {
    if (!useKind) return;
    setError(null);
    setStep("details");
  };

  const submit = async () => {
    setError(null);
    if (!useKind) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Name, email, and a password (6+ chars) are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (useKind === "company" && !orgName.trim()) {
      setError("Company name is required.");
      return;
    }

    setSaving(true);
    try {
      const workspaceName =
        orgName.trim() ||
        `${fullName.trim().split(" ")[0] || "My"}'s villas`;

      // Personal = solo workspace. Company register = owner only (staff use /join).
      const role = "owner" as const;

      if (isDemoMode()) {
        throw new Error(DEMO_READ_ONLY_MESSAGE);
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          orgName: workspaceName,
          kind: useKind,
          role,
          referredBy: referralCode,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not register.");
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/setup-passkey");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not register.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-sand px-4 py-10">
      <div className="mx-auto w-full max-w-md animate-rise">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher variant="inline" />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex justify-center">
            <PulseMark className="size-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{t("brand.tagline")}</p>
          {referralCode ? (
            <p className="mt-2 text-xs font-semibold text-secondary">
              {t("register.referralSaved")}
            </p>
          ) : null}
        </div>

        <Card className="space-y-4 p-5">
          {step === "use" ? (
            <div className="grid gap-3">
              <Choice
                icon={<UserRound className="size-5" />}
                title="Personal use"
                description="Just you and your properties - track work, bills, and jobs in one simple workspace."
                active={useKind === "personal"}
                onClick={() => setUseKind("personal")}
              />
              <Choice
                icon={<Building2 className="size-5" />}
                title="Company use"
                description="You are creating a new company as the owner. After setup you can invite your team."
                active={useKind === "company"}
                onClick={() => setUseKind("company")}
              />
              <Button
                className="w-full"
                disabled={!useKind}
                onClick={continueFromUse}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-3">
              <div>
                <Label>Full name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              {useKind === "company" ? (
                <div>
                  <Label>Company name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Phangan Properties Co."
                  />
                </div>
              ) : (
                <div>
                  <Label>Workspace name (optional)</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Sam's properties"
                  />
                </div>
              )}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error ? (
                <p className="text-sm font-semibold text-danger">{error}</p>
              ) : null}
              {useKind === "company" ? (
                <p className="text-xs text-muted">
                  Company accounts include 3 months of full features free while
                  billing is not live. By creating an account you agree to our{" "}
                  <Link href="/terms" className="font-semibold text-primary">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-primary">
                    Privacy
                  </Link>
                  .
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep("use")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={saving}
                  onClick={() => void submit()}
                >
                  {saving ? "Creating…" : "Create account"}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Choice({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-black/5 bg-white",
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-ink">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </button>
  );
}
