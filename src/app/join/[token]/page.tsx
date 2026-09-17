"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createClient, isDemoMode } from "@/lib/supabase/client";
import { getInviteContext } from "@/lib/demo/store";
import { DEMO_READ_ONLY_MESSAGE } from "@/lib/demo/guard";
import { rememberReferralCode, readReferralParam, REFERRAL_STORAGE_KEY, rememberAttribution, readAttribution } from "@/lib/billing/plans";
import { useI18n } from "@/lib/i18n/provider";
import { labelRole } from "@/lib/i18n/labels";
import type { Invite, Organization, Profile } from "@/lib/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [ctx, setCtx] = useState<{
    invite: Invite;
    org: Organization | null;
    inviter: Profile | null;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mergePending, setMergePending] = useState<{
    orgName: string;
    email: string;
    mergeUrl?: string;
    mergeEmailSent: boolean;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    rememberReferralCode(readReferralParam(params));
    rememberAttribution(readAttribution(params));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isDemoMode()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled && user?.email) setSessionEmail(user.email);
      }
      if (isDemoMode()) {
        if (!cancelled) {
          setCtx(getInviteContext(token));
          setLoaded(true);
        }
        return;
      }
      try {
        const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        const payload = (await res.json()) as {
          invite: Invite | null;
          org: Organization | null;
          inviter: Profile | null;
        };
        if (!cancelled) {
          setCtx(
            payload.invite
              ? {
                  invite: payload.invite,
                  org: payload.org,
                  inviter: payload.inviter,
                }
              : null,
          );
        }
      } catch {
        if (!cancelled) setCtx(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const acceptWithSession = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, joinWithSession: true }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      router.replace("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const accept = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError(t("join.nameEmailRequired"));
      return;
    }
    if (password.length < 6) {
      setError(t("join.passwordMin"));
      return;
    }
    if (password !== confirm) {
      setError(t("join.passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      if (isDemoMode()) {
        throw new Error(DEMO_READ_ONLY_MESSAGE);
      }
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName,
          email,
          phone,
          password,
          referredBy:
            typeof window !== "undefined"
              ? localStorage.getItem(REFERRAL_STORAGE_KEY)
              : null,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        needsMergeConfirm?: boolean;
        mergeEmailSent?: boolean;
        mergeUrl?: string;
        orgName?: string;
        email?: string;
        alreadyMember?: boolean;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? t("join.couldNotJoin"));
      }
      if (payload.needsMergeConfirm) {
        setMergePending({
          orgName: payload.orgName ?? t("join.thisCompany"),
          email: payload.email ?? email.trim().toLowerCase(),
          mergeUrl: payload.mergeUrl,
          mergeEmailSent: Boolean(payload.mergeEmailSent),
        });
        return;
      }
      if (payload.alreadyMember) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/setup-passkey");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("join.couldNotJoin"));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex h-dvh flex-col overflow-y-auto bg-sand">
        <div className="flex justify-end px-4 pt-4">
          <LanguageSwitcher variant="inline" />
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          {t("join.loading")}
        </div>
      </div>
    );
  }

  if (!ctx?.invite) {
    return (
      <div className="flex h-dvh flex-col overflow-y-auto bg-sand px-4">
        <div className="flex justify-end pt-4">
          <LanguageSwitcher variant="inline" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md space-y-3 p-6 text-center">
            <PulseMark className="mx-auto size-12" />
            <h1 className="font-display text-xl font-bold text-ink">
              {t("join.unavailableTitle")}
            </h1>
            <p className="text-sm text-muted">{t("join.unavailableHint")}</p>
            <Link href="/login" className="font-semibold text-primary">
              {t("join.backToSignIn")}
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (mergePending) {
    return (
      <div className="flex h-dvh flex-col overflow-y-auto bg-sand px-4">
        <div className="flex justify-end pt-4">
          <LanguageSwitcher variant="inline" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md space-y-3 p-6 text-center">
            <PulseMark className="mx-auto size-12" />
            <h1 className="font-display text-xl font-bold text-ink">
              {t("guest.mergeEmailTitle")}
            </h1>
            <p className="text-sm text-muted">
              {t("guest.mergeEmailHint", {
                email: mergePending.email,
                org: mergePending.orgName,
              })}
            </p>
            {!mergePending.mergeEmailSent && mergePending.mergeUrl ? (
              <p className="text-sm text-muted">
                {t("guest.mergeEmailFallback")}{" "}
                <Link
                  href={mergePending.mergeUrl}
                  className="font-semibold text-primary"
                >
                  {t("guest.mergeOpenLink")}
                </Link>
              </p>
            ) : null}
            <Link href="/login" className="font-semibold text-primary">
              {t("join.backToSignIn")}
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const { invite, org, inviter } = ctx;
  const isGuestInvite = invite.role === "guest";

  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-sand px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md animate-rise">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher variant="inline" />
        </div>
        <div className="mb-6 text-center">
          <PulseMark className="mx-auto mb-3 size-12" />
          <h1 className="font-display text-2xl font-bold text-ink">
            {isGuestInvite ? t("guest.joinTitle") : t("join.staffTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isGuestInvite ? t("guest.joinHint") : t("join.staffHint")}
          </p>
          <p className="mt-2 text-sm text-muted">
            <span className="font-semibold text-ink">
              {org?.name ?? t("join.thisOrganization")}
            </span>
            {inviter ? (
              <>
                {" "}
                · {inviter.full_name} ({labelRole(t, inviter.role)})
              </>
            ) : null}
          </p>
          <p className="mt-2 text-xs text-muted">{t("join.accountNote")}</p>
        </div>

        {sessionEmail ? (
          <Card className="mb-4 space-y-3 p-5">
            <p className="text-sm text-ink">
              {t("join.signedInHint", {
                email: sessionEmail,
                org: org?.name ?? "",
              })}
            </p>
            {error ? (
              <p className="text-sm font-semibold text-danger">{error}</p>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              disabled={saving}
              onClick={() => void acceptWithSession()}
            >
              {saving ? t("join.addingToAccount") : t("join.addToAccount")}
            </Button>
            <p className="text-center text-xs text-muted">
              {t("join.orNewAccount")}
            </p>
          </Card>
        ) : null}

        <Card className="space-y-4 p-5">
          <div className="rounded-2xl bg-[#F7F5F1] px-4 py-3 text-sm">
            <div className="flex justify-between gap-3 py-1">
              <span className="text-muted">{t("common.role")}</span>
              <span className="font-semibold text-ink">
                {labelRole(t, invite.role)}
              </span>
            </div>
            {invite.job_title ? (
              <div className="flex justify-between gap-3 py-1">
                <span className="text-muted">{t("join.jobTitle")}</span>
                <span className="font-semibold text-ink">{invite.job_title}</span>
              </div>
            ) : null}
          </div>

          <div>
            <Label>{t("join.fullName")}</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <Label>{t("common.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label>{t("join.phoneOptional")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <Label>{t("join.passwordLabel")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>{t("join.passwordConfirm")}</Label>
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

          <Button
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={() => void accept()}
          >
            {saving
              ? t("join.joining")
              : isGuestInvite
                ? t("guest.joinContinue")
                : t("join.accept")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
