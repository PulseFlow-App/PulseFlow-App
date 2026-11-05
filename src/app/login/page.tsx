"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { AddToHomeScreenModal } from "@/components/pwa/add-to-home-screen-modal";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import {
  isPasskeyAvailable,
  passkeyErrorMessage,
  signInWithPasskey,
} from "@/lib/auth/passkeys";
import { isEmailUnconfirmed, signOutIfUnconfirmed } from "@/lib/auth/email-confirmed";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { prosReturnPath } from "@/lib/pros/paths";
import { demoLogin, demoLogout } from "@/lib/demo/store";
import type { MessageKey } from "@/lib/i18n";
import { extractInviteToken } from "@/lib/billing/plans";

function afterAuthPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return prosReturnPath(next) ?? "/home";
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const DEMO_PASSWORD = "TestPass123!";

const fieldClass =
  "mt-1 w-full min-h-11 rounded-pf-control border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-pf-navy-600";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-pf-control border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-60";

const DEMO_ACCOUNTS: {
  role: "owner" | "manager" | "employee" | "guest";
  email: string;
  labelKey: MessageKey;
}[] = [
  { role: "owner", email: "owner@pulseflow.site", labelKey: "auth.demoOwner" },
  {
    role: "manager",
    email: "manager@pulseflow.site",
    labelKey: "auth.demoManager",
  },
  {
    role: "employee",
    email: "employee@pulseflow.site",
    labelKey: "auth.demoEmployee",
  },
  {
    role: "guest",
    email: "guest@pulseflow.site",
    labelKey: "auth.demoGuest",
  },
];

function demoAccountFromParam(demo: string | null) {
  if (!demo) return null;
  const key = demo.trim().toLowerCase();
  // Site marketing uses "staff"; app role key is "employee".
  const normalized = key === "staff" ? "employee" : key;
  return DEMO_ACCOUNTS.find((a) => a.role === normalized) ?? null;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const brandName = useBrandName();
  const [error, setError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<
    "owner" | "manager" | "employee" | "guest" | null
  >(null);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const demoAccount = demoAccountFromParam(demoRole);
  const isDemoPrefill = Boolean(demoAccount);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("demo")?.trim().toLowerCase();
    if (
      fromQuery === "owner" ||
      fromQuery === "manager" ||
      fromQuery === "employee" ||
      fromQuery === "staff" ||
      fromQuery === "guest"
    ) {
      const role =
        fromQuery === "staff"
          ? "employee"
          : (fromQuery as "owner" | "manager" | "employee" | "guest");
      setDemoRole(role);

      const account = DEMO_ACCOUNTS.find((a) => a.role === role);
      if (!account) return;

      // Marketing demo links must work even if a real account is already signed in:
      // clear that session, then enter the requested demo seat.
      void (async () => {
        try {
          if (!isDemoMode()) {
            await createClient().auth.signOut();
          }
          const profile = demoLogin(account.email, DEMO_PASSWORD);
          if (!profile) return;
          router.replace(afterAuthPath());
          router.refresh();
        } catch {
          /* Prefill still available if auto-enter fails */
        }
      })();
      return;
    }
    // Plain Sign in (no ?demo=): drop any sticky demo seat so a real
    // email/password or passkey sign-in is not masked by the demo cookie.
    setDemoRole(null);
    demoLogout();
  }, [router]);

  useEffect(() => {
    if (isDemoMode()) return;
    void isPasskeyAvailable().then(setPasskeyReady);
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "confirm") {
      setError(t("auth.emailNotConfirmed"));
    }
  }, [t]);

  useEffect(() => {
    if (window.location.hash === "#invite") {
      document.getElementById("invite-join")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!demoAccount) {
      setValue("email", "");
      setValue("password", "");
      return;
    }
    setValue("email", demoAccount.email);
    setValue("password", DEMO_PASSWORD);
  }, [demoAccount, setValue]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      // Only intentional demo seats (?demo= / chip) or a full demo deploy.
      // A leftover marketing-demo cookie must not hijack a real password sign-in.
      const useDemoSeat =
        Boolean(demoRole) || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

      if (useDemoSeat) {
        const profile = demoLogin(email, password);
        if (!profile) {
          setError(t("auth.invalidCredentials"));
          return;
        }
        router.replace(afterAuthPath());
        router.refresh();
        return;
      }

      demoLogout();
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (isEmailUnconfirmed(signInError) || (!signInError && (await signOutIfUnconfirmed(supabase)))) {
        setError(t("auth.emailNotConfirmed"));
        return;
      }
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace(afterAuthPath());
      router.refresh();
    } catch {
      setError(t("common.error"));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await signIn(values.email, values.password);
  });

  const signInWithPasskeyClick = async () => {
    setError(null);
    setPasskeyLoading(true);
    try {
      demoLogout();
      await signInWithPasskey();
      router.replace(afterAuthPath());
      router.refresh();
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const selectDemoRole = (role: "owner" | "manager" | "employee" | "guest") => {
    setDemoRole(role);
    const url = new URL(window.location.href);
    url.searchParams.set("demo", role);
    window.history.replaceState({}, "", url.toString());
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (account) {
      setValue("email", account.email);
      setValue("password", DEMO_PASSWORD);
    }
  };

  return (
    <div
      className="font-pf-sans h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-pf-page py-8 text-pf-ink"
      style={{
        paddingInline:
          "max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right))",
      }}
    >
      <AddToHomeScreenModal />
      <div className="mx-auto flex min-h-full w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-4 flex items-center justify-end gap-2">
            <LanguageSwitcher variant="inline" />
            <ThemeIconToggle />
          </div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <PulseMark className="size-16" />
            </div>
            <h1 className="text-pf-36 font-extrabold tracking-[-0.03em] text-pf-ink">
              {brandName}
            </h1>
            <p className="mx-auto mt-2 max-w-[70ch] text-pf-16 text-pf-text-secondary">
              {t("brand.tagline")}
            </p>
          </div>

          <div className="rounded-pf-card border border-pf-line bg-pf-card p-5">
            {isDemoPrefill ? (
              <div className="mb-5 space-y-2">
                <p className="text-pf-14 font-medium text-pf-text-secondary">
                  {t("auth.demoAccounts")}
                </p>
                <div className="grid gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => selectDemoRole(account.role)}
                      className={
                        account.role === demoRole
                          ? "min-h-11 rounded-pf-control bg-pf-peach-100 px-3 py-3 text-left"
                          : "min-h-11 rounded-pf-control border border-pf-line bg-pf-page px-3 py-3 text-left"
                      }
                    >
                      <p className="text-pf-16 font-medium text-pf-ink">
                        {t(account.labelKey)}
                      </p>
                      <p className="text-pf-14 text-pf-text-secondary">
                        {account.email}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="text-center text-pf-14 text-pf-text-secondary">
                  {t("auth.demoHint")}
                </p>
              </div>
            ) : null}

            {passkeyReady ? (
              <div className="mb-4 space-y-3">
                <button
                  type="button"
                  className={`${secondaryButtonClass} w-full gap-2`}
                  disabled={isSubmitting || passkeyLoading}
                  onClick={() => void signInWithPasskeyClick()}
                >
                  <Fingerprint className="size-5" aria-hidden />
                  {passkeyLoading
                    ? t("auth.signingInWithPasskey")
                    : t("auth.signInWithPasskey")}
                </button>
                <p className="text-center text-pf-14 text-pf-text-secondary">
                  {t("auth.passkeyDivider")}
                </p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="text-pf-14 font-medium text-pf-ink">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={fieldClass}
                  {...register("email")}
                />
              </div>
              <div>
                <label htmlFor="password" className="text-pf-14 font-medium text-pf-ink">
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={fieldClass}
                  {...register("password")}
                />
              </div>
              {error ? (
                <p className="text-pf-14 text-pf-danger-ink" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-pf-pill bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.signingIn") : t("auth.login")}
              </button>
            </form>

            <p className="mt-4 text-center text-pf-16 text-pf-text-secondary">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="font-medium text-pf-ink">
                {t("auth.register")}
              </Link>
            </p>

            <div id="invite-join" className="mt-5 border-t border-pf-line pt-4">
              <p className="text-pf-16 font-medium text-pf-ink">
                {t("auth.invitedToTeam")}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={inviteLink}
                  onChange={(e) => {
                    setInviteLink(e.target.value);
                    setInviteError(null);
                  }}
                  placeholder={t("auth.invitePlaceholder")}
                  autoComplete="off"
                  className={`${fieldClass} mt-0 min-w-0 flex-1`}
                />
                <button
                  type="button"
                  className={`${secondaryButtonClass} sm:shrink-0`}
                  onClick={() => {
                    const token = extractInviteToken(inviteLink);
                    if (!token) {
                      setInviteError(t("auth.inviteInvalid"));
                      return;
                    }
                    router.push(`/join/${token}`);
                  }}
                >
                  {t("auth.inviteOpen")}
                </button>
              </div>
              {inviteError ? (
                <p className="mt-2 text-pf-14 text-pf-danger-ink" role="alert">
                  {inviteError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
