"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import { isEmailUnconfirmed, signOutIfUnconfirmed } from "@/lib/auth/email-confirmed";
import { readPhoto } from "@/components/pros/parts";
import { usePros } from "@/lib/pros/store";
import { cn } from "@/lib/utils";
import { LegalAccept } from "@/components/pros/legal-accept";
import { saveServicesCustomer } from "@/lib/pros/trial";
import { prepareVillaPhotoFile } from "@/lib/villas/prepare-photo";

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function StartForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = usePros();
  const { dir, locale } = useI18n();
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
  const [confirmTo, setConfirmTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareVillaPhotoFile(file, 512);
      const data = await readPhoto(prepared);
      if (!data) {
        setLogo(null);
        setError(t("photoTooBig"));
        return;
      }
      setError(null);
      setLogo(data);
    } catch {
      setLogo(null);
      setError(t("photoTooBig"));
    }
  };

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
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (isEmailUnconfirmed(signInError) || (!signInError && (await signOutIfUnconfirmed(supabase)))) {
          setConfirmTo(email.trim());
          return;
        }
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
          locale,
          ...(logo ? { logo } : {}),
        }),
      });
      const payload = (await res.json()) as { error?: string; confirmEmail?: boolean };
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
      if (payload.confirmEmail) {
        setConfirmTo(email.trim());
        return;
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (isEmailUnconfirmed(signInError) || (!signInError && (await signOutIfUnconfirmed(supabase)))) {
        setConfirmTo(email.trim());
        return;
      }
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
      <Link href="/" className="inline-flex min-h-11 items-center gap-1 self-start rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink">
        <ArrowLeft className={cn("size-4", dir === "rtl" && "rotate-180")} strokeWidth={2} aria-hidden />
        {t("back")}
      </Link>
      <div className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        {confirmTo ? (
          <div className="space-y-3">
            <p className="font-display text-lg font-semibold text-pf-ink">{t("regConfirmTitle")}</p>
            <p className="text-sm leading-relaxed text-pf-slate-ink">{t("regConfirmBody", { email: confirmTo })}</p>
            <button
              type="button"
              disabled={resending}
              onClick={() => {
                setResending(true);
                void fetch("/api/auth/resend-confirm", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: confirmTo, locale, next: "/" }),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      const payload = (await res.json()) as { error?: string };
                      throw new Error(payload.error ?? "Could not send the email.");
                    }
                    setResent(true);
                    setError(null);
                  })
                  .catch((e: unknown) => {
                    setError(e instanceof Error ? e.message : "Could not send the email.");
                  })
                  .finally(() => setResending(false));
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-sm font-semibold text-pf-ink disabled:opacity-50"
            >
              {t("regConfirmResend")}
            </button>
            {resent ? <p className="text-sm text-pf-slate-ink">{t("regConfirmResent")}</p> : null}
            {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
          </div>
        ) : (
          <>
        {mode === "create" ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                aria-label={t("regLogo")}
                className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pf-line bg-pf-card text-pf-22 font-semibold text-pf-ink"
              >
                {logo ? <img src={logo} alt="" className="size-full object-cover" /> : "+"}
              </button>
              <div className="min-w-0">
                <p className="text-pf-16 font-medium text-pf-ink">{t("regLogo")}</p>
                {logo ? (
                  <button
                    type="button"
                    className="mt-1 min-h-11 text-pf-14 font-medium text-pf-ink underline"
                    onClick={() => {
                      if (logoInput.current) logoInput.current.value = "";
                      setLogo(null);
                    }}
                  >
                    {t("regLogoRemove")}
                  </button>
                ) : null}
              </div>
              <input
                ref={logoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={(e) => {
                  void pickLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <div>
              <Label>{t("yourName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          </>
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
          </>
        )}
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
