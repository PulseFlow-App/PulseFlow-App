"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { createClient, isDemoMode } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";

type HandoffPayload = {
  handoff: {
    id: string;
    token: string;
    status: string;
    toEmail: string;
    toFullName: string | null;
    createCompany: boolean;
    companyName: string | null;
    targetOrgId: string | null;
    resultingOrgId: string | null;
  };
  inviter: { id: string; fullName: string } | null;
  villas: { id: string; name: string; area: string | null }[];
  targetOrg: { id: string; name: string } | null;
};

export default function HandoffPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [payload, setPayload] = useState<HandoffPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [orgId, setOrgId] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

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
      try {
        const res = await fetch(`/api/handoff/${encodeURIComponent(token)}`);
        const body = (await res.json()) as HandoffPayload & { error?: string };
        if (!res.ok) {
          if (!cancelled) {
            setError(body.error ?? t("handoff.unavailable"));
            setLoaded(true);
          }
          return;
        }
        if (!cancelled) {
          setPayload(body);
          if (body.targetOrg?.id) setOrgId(body.targetOrg.id);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setError(t("handoff.unavailable"));
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  useEffect(() => {
    if (!sessionEmail || !payload || payload.handoff.createCompany) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/org/owned");
        if (!res.ok) return;
        const body = (await res.json()) as {
          companies: { id: string; name: string }[];
        };
        if (cancelled) return;
        setCompanies(body.companies ?? []);
        if (!orgId && body.companies?.length === 1) {
          setOrgId(body.companies[0].id);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionEmail, payload, orgId]);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/handoff/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            payload?.handoff.createCompany
              ? {}
              : { orgId: orgId || undefined },
          ),
        },
      );
      const body = (await res.json()) as {
        error?: string;
        needsOrgChoice?: boolean;
      };
      if (!res.ok) {
        throw new Error(body.error ?? t("handoff.acceptError"));
      }
      setDone(true);
      router.push("/villas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("handoff.acceptError"));
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <Shell>
        <p className="text-sm text-muted">{t("handoff.loading")}</p>
      </Shell>
    );
  }

  if (!payload) {
    return (
      <Shell>
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="font-display text-xl font-bold text-ink">
            {t("handoff.unavailableTitle")}
          </h1>
          <p className="text-sm text-muted">{error ?? t("handoff.unavailable")}</p>
          <Link href="/login" className="font-semibold text-primary">
            {t("join.backToSignIn")}
          </Link>
        </Card>
      </Shell>
    );
  }

  const { handoff, inviter, villas } = payload;
  const emailMatch =
    sessionEmail &&
    sessionEmail.trim().toLowerCase() ===
      handoff.toEmail.trim().toLowerCase();

  if (handoff.status !== "pending" || done) {
    return (
      <Shell>
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="font-display text-xl font-bold text-ink">
            {t("handoff.alreadyDoneTitle")}
          </h1>
          <p className="text-sm text-muted">{t("handoff.alreadyDoneHint")}</p>
          <Link href="/villas" className="font-semibold text-primary">
            {t("handoff.goToVillas")}
          </Link>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="w-full max-w-md space-y-4 p-6">
        <PulseMark className="mx-auto size-12" />
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-ink">
            {t("handoff.acceptTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t("handoff.acceptHint", {
              name: inviter?.fullName ?? t("handoff.someone"),
            })}
          </p>
        </div>

        <ul className="space-y-1 rounded-[var(--radius-md)] bg-canvas px-3 py-2">
          {villas.map((v) => (
            <li key={v.id} className="text-sm font-semibold text-ink">
              {v.name}
              {v.area ? (
                <span className="font-normal text-muted"> · {v.area}</span>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted">
          {handoff.createCompany
            ? t("handoff.acceptCreateCompany", {
                company: handoff.companyName ?? "",
              })
            : t("handoff.acceptAttachCompany")}
        </p>

        {!handoff.createCompany && emailMatch && companies.length > 0 ? (
          <div>
            <Label htmlFor="handoff-org">{t("handoff.chooseCompany")}</Label>
            <Select
              id="handoff-org"
              className="mt-1"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              <option value="">{t("settings.selectPerson")}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {!handoff.createCompany && emailMatch && companies.length === 0 ? (
          <p className="text-sm font-semibold text-danger">
            {t("handoff.modeAttachHint")}
          </p>
        ) : null}

        <p className="type-meta">
          {t("handoff.mustSignInAs", { email: handoff.toEmail })}
        </p>

        {!sessionEmail ? (
          <div className="flex flex-col gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(`/handoff/${token}`)}`}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-bold text-white"
            >
              {t("handoff.signInToAccept")}
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(`/handoff/${token}`)}`}
              className="text-center text-sm font-semibold text-secondary"
            >
              {t("handoff.createAccount")}
            </Link>
          </div>
        ) : !emailMatch ? (
          <p className="text-sm font-semibold text-danger">
            {t("handoff.wrongAccount", {
              current: sessionEmail,
              expected: handoff.toEmail,
            })}
          </p>
        ) : (
          <Button
            className="w-full"
            disabled={
              busy ||
              (!handoff.createCompany &&
                (companies.length === 0 || !orgId))
            }
            onClick={() => void accept()}
          >
            {busy ? t("common.saving") : t("handoff.accept")}
          </Button>
        )}

        {error ? (
          <p className="text-sm font-semibold text-danger">{error}</p>
        ) : null}
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-sand px-4">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher variant="inline" />
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        {children}
      </div>
    </div>
  );
}
