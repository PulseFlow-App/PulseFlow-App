"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, UserRound, Briefcase, HardHat } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { brand } from "@/lib/design-tokens";
import type { OrgKind } from "@/lib/design-tokens";
import { isDemoMode } from "@/lib/supabase/client";
import { demoRegisterWorkspace } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Step = "use" | "version" | "details";
type AppVersion = "owner" | "employee";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("use");
  const [useKind, setUseKind] = useState<OrgKind | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    if (step === "use") return "How will you use PulseFlow?";
    if (step === "version") return "Which app version do you need?";
    return version === "owner"
      ? "Create your organization"
      : "Set up your workspace";
  }, [step, version]);

  const submit = async () => {
    setError(null);
    if (!useKind || !version) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Name, email, and a password (6+ chars) are required.");
      return;
    }
    if (version === "owner" && !orgName.trim()) {
      setError("Organization name is required for owners.");
      return;
    }
    if (version === "employee" && useKind === "company") {
      setError(
        "Company employees join via an invite link from their owner or manager. Ask them for a link, or choose Personal use to run your own list.",
      );
      return;
    }

    if (!isDemoMode()) {
      setError(
        "Full registration against Supabase will activate once your project keys are connected. Demo mode is on for now.",
      );
      return;
    }

    setSaving(true);
    try {
      const role = version === "owner" ? "owner" : "manager";
      const workspaceName =
        orgName.trim() ||
        (useKind === "personal"
          ? `${fullName.trim().split(" ")[0]}'s villas`
          : fullName.trim());

      demoRegisterWorkspace({
        fullName,
        email,
        phone,
        password,
        orgName: workspaceName,
        kind: useKind,
        role,
      });
      router.replace("/home");
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
          <LanguageSwitcher compact />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex justify-center">
            <PulseMark className="size-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{t("brand.tagline")}</p>
        </div>

        <Card className="space-y-4 p-5">
          {step === "use" ? (
            <div className="grid gap-3">
              <Choice
                icon={<UserRound className="size-5" />}
                title="Personal use"
                description="You run the villas yourself - create your own lists and invite helpers later."
                active={useKind === "personal"}
                onClick={() => setUseKind("personal")}
              />
              <Choice
                icon={<Building2 className="size-5" />}
                title="Company use"
                description="Portfolio with an owner and on-site team. Owner creates the org; staff join by invite."
                active={useKind === "company"}
                onClick={() => setUseKind("company")}
              />
              <Button
                className="w-full"
                disabled={!useKind}
                onClick={() => setStep("version")}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "version" ? (
            <div className="grid gap-3">
              <Choice
                icon={<Briefcase className="size-5" />}
                title="Owner"
                description="Create the organization, invite managers & staff, assign villas across the team."
                active={version === "owner"}
                onClick={() => setVersion("owner")}
              />
              <Choice
                icon={<HardHat className="size-5" />}
                title="Employee / manager"
                description={
                  useKind === "company"
                    ? "Join a company with an invite link. Without a link, use Personal use instead."
                    : "Run your own ops workspace and invite cleaning / staff under you (not owners)."
                }
                active={version === "employee"}
                onClick={() => setVersion("employee")}
              />
              {useKind === "company" && version === "employee" ? (
                <p className="rounded-xl bg-warning/15 px-3 py-2 text-xs text-warning-dark">
                  Company employees must use an invite link from their owner or
                  manager.{" "}
                  <Link href="/login" className="font-semibold underline">
                    Back to sign in
                  </Link>
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
                  disabled={
                    !version ||
                    (useKind === "company" && version === "employee")
                  }
                  onClick={() => setStep("details")}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-3">
              <div>
                <Label>Full name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {version === "owner" || useKind === "personal" ? (
                <div>
                  <Label>
                    {version === "owner"
                      ? "Organization name"
                      : "Workspace name"}
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={
                      version === "owner"
                        ? "Phangan Villas Co."
                        : "Sam's villa ops"
                    }
                  />
                </div>
              ) : null}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? (
                <p className="text-sm font-semibold text-danger">{error}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep("version")}
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
