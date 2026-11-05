"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { ServicesMark } from "@/components/brand/services-mark";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { AddToHomeScreenModal } from "@/components/pwa/add-to-home-screen-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { isEmailUnconfirmed, signOutIfUnconfirmed } from "@/lib/auth/email-confirmed";
import { inviteTokenFromLink } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/design-tokens";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALE_META, type Locale } from "@/lib/i18n/types";

const STAFF_LOCALES = ["en", "th"] as const satisfies readonly Locale[];
import {
  REFERRAL_STORAGE_KEY,
  readReferralParam,
  rememberReferralCode,
  readAttribution,
  rememberAttribution,
  readStoredAttribution,
} from "@/lib/billing/plans";
import { DEMO_READ_ONLY_MESSAGE } from "@/lib/demo/guard";
import { AREAS, CATEGORIES } from "@/lib/pros/catalog";
import { appOriginForHost, isMarketplaceHost, MARKETPLACE_ORIGIN } from "@/lib/pros/paths";
import { readPhoto } from "@/components/pros/parts";
import { LegalAccept } from "@/components/pros/legal-accept";
import { prosT } from "@/lib/pros/i18n";
import { saveServicesCustomer } from "@/lib/pros/trial";
import {
  areaLabels,
  joinProfessional,
  recordSignup,
  talentSkillsForCategories,
} from "@/lib/pros/join";
import { formatThaiPhone } from "@/lib/utils";
import { prepareVillaPhotoFile } from "@/lib/villas/prepare-photo";

type Track = "maintenance" | "customer";
type Plan = "personal" | "company";
type Position = "management" | "staff";
type CompanySeat = Extract<UserRole, "owner" | "manager">;

function catalogName(names: { en: string }, locale: string) {
  const bag = names as Record<string, string>;
  return bag[locale] ?? names.en;
}

const MARKETING_SERVICES = "https://www.pulseflow.site/services";

function existingAccount(message: string) {
  return /already been registered|already registered|already exists/i.test(message);
}

function LogoField({
  logo,
  label,
  removeLabel,
  onPick,
  onClear,
}: {
  logo: string | null;
  label: string;
  removeLabel: string;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={label}
        className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-card text-lg font-semibold text-ink"
      >
        {logo ? <img src={logo} alt="" className="size-full object-cover" /> : "+"}
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {logo ? (
          <button
            type="button"
            className="mt-1 min-h-11 text-sm font-semibold text-ink underline"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              onClear();
            }}
          >
            {removeLabel}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

async function signInWithPassword(email: string, password: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return error;
  if (await signOutIfUnconfirmed(supabase)) {
    return { message: "Email not confirmed", code: "email_not_confirmed" };
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale, setLocale, dir } = useI18n();
  const [track, setTrack] = useState<Track | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  /** null until the user taps a top card — keeps Personal/Company hidden on first paint. */
  const [position, setPosition] = useState<Position | null>(null);
  const [listOnServices, setListOnServices] = useState(false);
  const [companyInvite, setCompanyInvite] = useState("");
  const [companySeat, setCompanySeat] = useState<CompanySeat | null>(null);
  const [payer, setPayer] = useState<CompanySeat | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [lineId, setLineId] = useState("");
  const [sameWhatsapp, setSameWhatsapp] = useState(false);
  const [sameLine, setSameLine] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [availability, setAvailability] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [openIsland, setOpenIsland] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emails, setEmails] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [confirmTo, setConfirmTo] = useState<string | null>(null);
  const [pendingNext, setPendingNext] = useState("/");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [servicesHref, setServicesHref] = useState(MARKETING_SERVICES);
  const [appHref, setAppHref] = useState("https://app.pulseflow.site/");
  const [onServices, setOnServices] = useState(false);
  const [ready, setReady] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [acquisitionSource, setAcquisitionSource] = useState<string | null>(null);

  useEffect(() => {
    const { protocol, hostname, port, host } = window.location;
    const services = isMarketplaceHost(host);
    setOnServices(services);
    setReady(true);
    setAppHref(`${appOriginForHost(host, protocol)}/`);
    if (services) {
      setServicesHref("/");
    } else if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      setServicesHref(`${protocol}//services.localhost${port ? `:${port}` : ""}/`);
    } else {
      setServicesHref(`${MARKETPLACE_ORIGIN}/`);
    }
    demoLogout();
    const params = new URLSearchParams(window.location.search);
    const fromQuery = readReferralParam(params);
    if (fromQuery) {
      rememberReferralCode(fromQuery);
      setReferralCode(fromQuery);
    } else {
      setReferralCode(localStorage.getItem(REFERRAL_STORAGE_KEY));
    }
    const attr = readAttribution(params);
    rememberAttribution(attr);
    const stored = readStoredAttribution();
    const src =
      attr.src ||
      attr.utm_campaign ||
      attr.utm_source ||
      stored?.src ||
      stored?.utm_campaign ||
      stored?.utm_source ||
      null;
    setAcquisitionSource(src);

    if (services) {
      const as = params.get("as");
      const maintenance = as === "pro" || params.get("track") === "maintenance";
      if (maintenance) setTrack("maintenance");
      else if (as === "seeker" || params.get("track") === "customer") setTrack("customer");
    } else {
      // Always start with only the two top cards. Sub-plans appear after a tap.
      setPosition(null);
      setPlan(null);
      if (params.get("track") === "maintenance" || params.get("position") === "staff") {
        setPosition("staff");
        setPlan("personal");
      }
    }
  }, []);

  useEffect(() => {
    if (!onServices || track !== "maintenance") return;
    if (locale === "en" || locale === "th") return;
    setLocale("en");
  }, [onServices, track, locale, setLocale]);

  const islands = useMemo(
    () => AREAS.filter((area) => area.level === "locality"),
    [],
  );
  const thaiPhone = formatThaiPhone(phone);
  const whatsappValue = sameWhatsapp && thaiPhone ? thaiPhone : whatsapp;
  const lineValue = sameLine && thaiPhone ? thaiPhone : lineId;
  const showAppForm = ready && !onServices && !confirmTo && (position === "staff" || plan != null);
  const showServicesForm = ready && onServices && !confirmTo && track != null;

  const holdForEmail = (address: string, next: string) => {
    setConfirmTo(address.trim());
    setPendingNext(next);
    setResent(false);
    setResendError(null);
    setError(null);
  };

  const resendConfirm = async () => {
    if (!confirmTo) return;
    setResending(true);
    setResendError(null);
    try {
      const res = await fetch("/api/auth/resend-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmTo, locale, next: pendingNext }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Could not send the email.");
      setResent(true);
    } catch (e) {
      setResendError(e instanceof Error ? e.message : "Could not send the email.");
    } finally {
      setResending(false);
    }
  };

  const toggle = (list: string[], id: string, set: (next: string[]) => void) => {
    set(list.includes(id) ? list.filter((row) => row !== id) : [...list, id]);
  };

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareVillaPhotoFile(file, 512);
      const data = await readPhoto(prepared);
      if (!data) {
        setLogo(null);
        setError(onServices ? prosT(locale, "photoTooBig") : "Use a photo under 1.4 MB.");
        return;
      }
      setError(null);
      setLogo(data);
    } catch {
      setLogo(null);
      setError(onServices ? prosT(locale, "photoTooBig") : "Use a photo under 1.4 MB.");
    }
  };

  const submitServices = async () => {
    if (!track) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError(prosT(locale, "regRequired"));
      return;
    }
    if (password !== confirm) {
      setError(prosT(locale, "regMismatch"));
      return;
    }
    if (!accepted) {
      setError(prosT(locale, "legalNeedScroll"));
      return;
    }
    const termsAcceptedAt = new Date().toISOString();
    if (track === "maintenance") {
      if (!whatsappValue.trim() && !lineValue.trim()) {
        setError(prosT(locale, "regContact"));
        return;
      }
      if (!categoryIds.length || !areaIds.length) {
        setError(prosT(locale, "regNeedTrade"));
        return;
      }
    }

    setSaving(true);
    try {
      if (track === "customer") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            orgName: `${fullName.trim().split(" ")[0] || "My"}'s services`,
            kind: "personal",
            track: "management",
            role: "owner",
            servicesIntent: "hire",
            referredBy: referralCode,
            acquisitionSource,
            termsAcceptedAt,
            emailOptIn: emails,
            locale,
            ...(logo ? { logo } : {}),
          }),
        });
        const payload = (await res.json()) as { error?: string; confirmEmail?: boolean };
        if (!res.ok) {
          const message = payload.error ?? prosT(locale, "regFailed");
          if (/supabase|demo/i.test(message)) {
            saveServicesCustomer({ name: fullName, email, termsAcceptedAt, emailOptIn: emails });
            router.replace("/");
            return;
          }
          if (!existingAccount(message)) throw new Error(message);
        }
        if (payload.confirmEmail) {
          holdForEmail(email, "/");
          return;
        }
        const signInError = await signInWithPassword(email, password);
        if (isEmailUnconfirmed(signInError)) {
          holdForEmail(email, "/");
          return;
        }
        if (signInError) {
          throw new Error(
            existingAccount(payload.error ?? "")
              ? prosT(locale, "existingAccountPassword")
              : signInError.message,
          );
        }
        router.replace("/");
        router.refresh();
        return;
      }

      if (isDemoMode()) {
        setListingId(
          joinProfessional({
            name: fullName,
            email,
            phone,
            whatsapp: whatsappValue,
            lineId: lineValue,
            description: "",
            availability,
            categoryIds,
            areaIds,
            languages,
            listNow: listOnServices,
            referrer: referralCode,
            emailOptIn: emails,
            termsAcceptedAt,
            photoUrl: logo,
          }).id,
        );
        return;
      }

      const { withActionBusy } = await import("@/lib/ui/action-busy");
      let waitingForEmail = false;
      await withActionBusy(async () => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
            orgName: `${fullName.trim().split(" ")[0] || "My"}'s properties`,
            kind: "personal",
            track: "maintenance",
            position: "staff",
            servicesIntent: "work",
            referredBy: referralCode,
            acquisitionSource,
            termsAcceptedAt,
            emailOptIn: emails,
            listOnServices,
            locale,
            service: {
              skills: talentSkillsForCategories(categoryIds),
              bio: availability.trim() ? `Available: ${availability.trim()}` : "",
              location: areaLabels(areaIds).join(", "),
              country: "Thailand",
              listNow: listOnServices,
            },
            ...(logo ? { logo } : {}),
          }),
        });
        const payload = (await res.json()) as { error?: string; confirmEmail?: boolean };
        if (!res.ok && !existingAccount(payload.error ?? "")) {
          throw new Error(payload.error ?? prosT(locale, "regFailed"));
        }
        if (payload.confirmEmail) {
          waitingForEmail = true;
          holdForEmail(email, "/settings");
          return;
        }
        const signInError = await signInWithPassword(email, password);
        if (isEmailUnconfirmed(signInError)) {
          waitingForEmail = true;
          holdForEmail(email, "/settings");
          return;
        }
        if (signInError) {
          throw new Error(
            existingAccount(payload.error ?? "")
              ? prosT(locale, "existingAccountPassword")
              : signInError.message,
          );
        }
      });
      if (waitingForEmail) return;
      joinProfessional({
        name: fullName,
        email,
        phone,
        whatsapp: whatsappValue,
        lineId: lineValue,
        description: "",
        availability,
        categoryIds,
        areaIds,
        languages,
        listNow: listOnServices,
        referrer: referralCode,
        emailOptIn: emails,
        termsAcceptedAt,
        photoUrl: logo,
      });
      router.replace("/settings");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : prosT(locale, "regFailed"));
    } finally {
      setSaving(false);
    }
  };

  const submitApp = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Name, email, and a password (6+ chars) are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const onSite = position === "staff";
    const companyInviteToken = onSite ? inviteTokenFromLink(companyInvite) : null;
    if (onSite && !companyInvite.trim()) {
      setError(t("register.companyInviteRequired"));
      return;
    }
    if (onSite && !companyInviteToken) {
      setError(t("register.companyInviteInvalid"));
      return;
    }
    if (onSite && listOnServices && !accepted) {
      setError(prosT(locale, "legalNeedScroll"));
      return;
    }
    if (!onSite && !plan) {
      return;
    }
    if (!onSite && plan === "company") {
      if (!orgName.trim()) {
        setError("Company name is required.");
        return;
      }
      if (!companySeat) {
        setError(t("register.seatRequired"));
        return;
      }
    }

    const termsAcceptedAt = new Date().toISOString();
    setSaving(true);
    try {
      if (onSite && listOnServices) {
        joinProfessional({
          name: fullName,
          email,
          phone,
          whatsapp: "",
          lineId: "",
          description: "",
          availability,
          categoryIds: [],
          areaIds: [],
          languages: [locale],
          listNow: true,
          referrer: referralCode,
          emailOptIn: emails,
          termsAcceptedAt,
          photoUrl: logo,
        });
      } else if (!onSite && plan) {
        recordSignup({
          name: fullName.trim(),
          email: email.trim(),
          track: "management",
          plan,
          role: plan === "company" ? companySeat : "owner",
          payer: plan === "company" ? payer : null,
          referrer: referralCode,
          emailOptIn: emails,
          termsAcceptedAt,
        });
      }

      if (isDemoMode() && !(onSite && isSupabaseConfigured())) {
        if (onSite) {
          router.replace(listOnServices ? servicesHref + "settings" : "/home");
          return;
        }
        throw new Error(DEMO_READ_ONLY_MESSAGE);
      }

      const workspaceName =
        orgName.trim() ||
        `${fullName.trim().split(" ")[0] || "My"}'s properties`;
      const { withActionBusy } = await import("@/lib/ui/action-busy");
      let waitingForEmail = false;
      await withActionBusy(async () => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
            orgName: workspaceName,
            kind: onSite || plan === "personal" ? "personal" : "company",
            role: onSite ? "staff" : plan === "company" ? companySeat : "owner",
            payer: !onSite && plan === "company" ? payer ?? companySeat ?? "owner" : undefined,
            position: onSite ? "staff" : "management",
            track: onSite ? "maintenance" : "management",
            servicesIntent: onSite ? "work" : undefined,
            inviteToken: onSite ? companyInviteToken : undefined,
            listOnServices: onSite ? listOnServices : false,
            referredBy: referralCode,
            acquisitionSource,
            termsAcceptedAt,
            emailOptIn: emails,
            locale,
            ...(logo ? { logo } : {}),
            service: onSite
              ? {
                  skills: ["maintenance"],
                  bio: availability.trim() ? `Available: ${availability.trim()}` : "",
                  listNow: listOnServices,
                }
              : undefined,
          }),
        });
        const payload = (await res.json()) as { error?: string; confirmEmail?: boolean };
        if (!res.ok) throw new Error(payload.error ?? "Could not register.");
        if (payload.confirmEmail) {
          waitingForEmail = true;
          holdForEmail(email, "/setup-passkey");
          return;
        }
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (!signInError && (await signOutIfUnconfirmed(supabase))) {
          waitingForEmail = true;
          holdForEmail(email, "/setup-passkey");
          return;
        }
        if (isEmailUnconfirmed(signInError)) {
          waitingForEmail = true;
          holdForEmail(email, "/setup-passkey");
          return;
        }
        if (signInError) throw signInError;
      });
      if (waitingForEmail) return;
      if (onSite && listOnServices) {
        window.location.href = `${servicesHref.replace(/\/$/, "")}/settings`;
        return;
      }
      router.replace("/setup-passkey");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not register.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-sand py-10"
      style={{
        paddingInline:
          "max(0.5rem, env(safe-area-inset-left)) max(0.5rem, env(safe-area-inset-right))",
      }}
    >
      <AddToHomeScreenModal />
      <div className="mx-auto w-full max-w-lg animate-rise">
        <div className="mb-4 flex items-center justify-between gap-1.5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--color-border)] bg-card px-3 text-sm font-semibold text-ink"
          >
            <ArrowLeft className={cn("size-4", dir === "rtl" && "rotate-180")} strokeWidth={2} aria-hidden />
            {onServices ? prosT(locale, "back") : t("common.back")}
          </Link>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher variant="inline" locales={onServices && track === "maintenance" ? STAFF_LOCALES : undefined} />
            <ThemeIconToggle />
          </div>
        </div>
        <div className="mb-6 text-center">
          {ready ? (
            <div className="mx-auto mb-3 flex justify-center">
              {onServices ? <ServicesMark className="size-12" /> : <PulseMark className="size-12" />}
            </div>
          ) : null}
          <h1 className="font-display text-2xl font-bold text-ink">
            {onServices ? prosT(locale, "regAccountTitle") : t("register.accountTitle")}
          </h1>
        </div>

        {confirmTo ? (
          <Card className="space-y-3 p-4">
            <p className="font-display text-lg font-semibold text-ink">
              {onServices ? prosT(locale, "regConfirmTitle") : t("register.confirmTitle")}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              {onServices
                ? prosT(locale, "regConfirmBody", { email: confirmTo })
                : t("register.confirmBody", { email: confirmTo })}
            </p>
            <button
              type="button"
              disabled={resending}
              onClick={() => void resendConfirm()}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-card px-4 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {onServices ? prosT(locale, "regConfirmResend") : t("register.confirmResend")}
            </button>
            {resent ? (
              <p className="text-sm text-muted">
                {onServices ? prosT(locale, "regConfirmResent") : t("register.confirmResent")}
              </p>
            ) : null}
            {resendError ? <p className="text-sm font-medium text-danger">{resendError}</p> : null}
          </Card>
        ) : null}

        {ready && onServices && !track && !confirmTo ? (
          <p className="text-center text-sm text-muted">
            <Link href="/" className="font-semibold text-ink">
              {prosT(locale, "registerPickSide")}
            </Link>
          </p>
        ) : null}

        {/* App host: two cards first; personal/company only after management */}
        {ready && !onServices && !confirmTo ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Choice
                compact
                icon={<PulseIcon name="properties" className="size-4" />}
                title={t("register.positionManagement")}
                description={t("register.positionManagementHint")}
                active={position === "management"}
                onClick={() => {
                  setPosition("management");
                  setPlan(null);
                  setCompanySeat(null);
                  setPayer(null);
                  setListOnServices(false);
                  setError(null);
                }}
              />
              <Choice
                compact
                icon={<PulseIcon name="invite" className="size-4" />}
                title={t("register.positionStaff")}
                description={t("register.positionStaffHint")}
                active={position === "staff"}
                onClick={() => {
                  setPosition("staff");
                  setPlan("personal");
                  setCompanySeat(null);
                  setPayer(null);
                  setError(null);
                }}
              />
            </div>
            {position === "management" && (
              <div className="grid grid-cols-2 gap-2" key="management-plans">
                <Choice
                  compact
                  icon={<PulseIcon name="home" className="size-4" />}
                  title={t("register.personalUse")}
                  description={t("register.personalPlanHint")}
                  active={plan === "personal"}
                  onClick={() => {
                    setPlan("personal");
                    setCompanySeat(null);
                    setPayer(null);
                  }}
                />
                <Choice
                  compact
                  icon={<PulseIcon name="properties" className="size-4" />}
                  title={t("register.companyPlan")}
                  description={t("register.companyPlanHint")}
                  active={plan === "company"}
                  onClick={() => setPlan("company")}
                />
              </div>
            )}
          </div>
        ) : null}

        {showServicesForm ? (
          <Card className="mt-4 space-y-2 p-4">
            {listingId ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">{t("register.savedListing")}</p>
                <p className="text-sm text-muted">{t("register.listingStaysHidden")}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" type="button" onClick={() => router.push(`/p/${listingId}`)}>
                    {prosT(locale, "regView")}
                  </Button>
                  <Button className="flex-1" variant="secondary" type="button" onClick={() => router.push("/find")}>
                    {prosT(locale, "directory")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-display text-lg font-semibold text-ink">
                  {track === "maintenance" ? prosT(locale, "regPro") : prosT(locale, "regSeeking")}
                </p>
                <LogoField
                  logo={logo}
                  label={prosT(locale, "regLogo")}
                  removeLabel={prosT(locale, "regLogoRemove")}
                  onPick={(file) => void pickLogo(file)}
                  onClear={() => setLogo(null)}
                />
                <div>
                  <Label>{prosT(locale, "yourName")}</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    placeholder={prosT(locale, "yourName")}
                  />
                </div>
                <div>
                  <Label>{prosT(locale, "regEmail")}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder={prosT(locale, "regEmail")}
                  />
                </div>
                {track === "maintenance" ? (
                  <>
                    <div>
                      <Label>{prosT(locale, "regPhone")}</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        placeholder={prosT(locale, "regPhone")}
                      />
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{prosT(locale, "regContact")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>{prosT(locale, "whatsapp")}</Label>
                        <Input
                          value={whatsappValue}
                          onChange={(e) => {
                            setSameWhatsapp(false);
                            setWhatsapp(e.target.value);
                          }}
                          placeholder={prosT(locale, "whatsapp")}
                          readOnly={sameWhatsapp && Boolean(thaiPhone)}
                        />
                        <label className="mt-1 flex min-h-11 items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={sameWhatsapp && Boolean(thaiPhone)}
                            disabled={!thaiPhone}
                            onChange={(e) => setSameWhatsapp(e.target.checked)}
                          />
                          <span>{prosT(locale, "useSameNumber")}</span>
                        </label>
                      </div>
                      <div>
                        <Label>{prosT(locale, "line")}</Label>
                        <Input
                          value={lineValue}
                          onChange={(e) => {
                            setSameLine(false);
                            setLineId(e.target.value);
                          }}
                          placeholder={prosT(locale, "line")}
                          readOnly={sameLine && Boolean(thaiPhone)}
                        />
                        <label className="mt-1 flex min-h-11 items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={sameLine && Boolean(thaiPhone)}
                            disabled={!thaiPhone}
                            onChange={(e) => setSameLine(e.target.checked)}
                          />
                          <span>{prosT(locale, "useSameNumber")}</span>
                        </label>
                      </div>
                    </div>
                    <fieldset>
                      <legend className="text-sm font-semibold text-ink">{prosT(locale, "trades")}</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                          <Chip
                            key={category.id}
                            active={categoryIds.includes(category.id)}
                            label={catalogName(category.names, locale)}
                            onClick={() => toggle(categoryIds, category.id, setCategoryIds)}
                          />
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="text-sm font-semibold text-ink">{prosT(locale, "regAreas")}</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {islands.map((island) => {
                          const open = openIsland === island.id;
                          const covered =
                            areaIds.includes(island.id) ||
                            AREAS.some((area) => area.parentId === island.id && areaIds.includes(area.id));
                          return (
                            <button
                              key={island.id}
                              type="button"
                              aria-expanded={open}
                              onClick={() => setOpenIsland(open ? null : island.id)}
                              className={cn(
                                "min-h-11 rounded-pf-card border px-2 py-2 text-center text-sm font-semibold leading-snug text-pf-ink",
                                open
                                  ? "border-pf-line bg-pf-peach-100"
                                  : covered
                                    ? "border-pf-navy-600 bg-pf-card"
                                    : "border-pf-line bg-pf-card",
                              )}
                            >
                              {catalogName(island.names, locale)}
                            </button>
                          );
                        })}
                      </div>
                      {openIsland ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {AREAS.filter((area) => area.parentId === openIsland).map((area) => (
                            <Chip
                              key={area.id}
                              active={areaIds.includes(area.id)}
                              label={catalogName(area.names, locale)}
                              onClick={() => toggle(areaIds, area.id, setAreaIds)}
                            />
                          ))}
                        </div>
                      ) : null}
                    </fieldset>
                    <fieldset>
                      <legend className="text-sm font-semibold text-ink">{prosT(locale, "languages")}</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {STAFF_LOCALES.map((code) => (
                          <Chip
                            key={code}
                            active={languages.includes(code)}
                            label={LOCALE_META[code].native}
                            onClick={() => toggle(languages, code, setLanguages)}
                          />
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <Label>{prosT(locale, "availability")}</Label>
                      <Input
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder={prosT(locale, "regWhenHint")}
                      />
                    </div>
                  </>
                ) : null}
                <div>
                  <Label>{prosT(locale, "regPassword")}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder={prosT(locale, "regPassword")}
                  />
                </div>
                <div>
                  <Label>{prosT(locale, "passwordAgain")}</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder={prosT(locale, "passwordAgain")}
                  />
                </div>
                {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
                <LegalAccept
                  audience={track === "maintenance" ? "staff" : "customer"}
                  accepted={accepted}
                  onAccepted={setAccepted}
                  emails={emails}
                  onEmails={setEmails}
                />
                {track === "maintenance" ? (
                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-card px-3 py-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={listOnServices}
                      onChange={(e) => setListOnServices(e.target.checked)}
                    />
                    <span className="font-semibold">{prosT(locale, "regListMarketplace")}</span>
                  </label>
                ) : null}
                <Button className="w-full" busy={saving} disabled={!accepted} onClick={() => void submitServices()}>
                  {saving ? prosT(locale, "regCreating") : prosT(locale, "regCreate")}
                </Button>
              </>
            )}
          </Card>
        ) : null}

        {showAppForm ? (
          <Card className="mt-4 space-y-2 p-4">
            <LogoField
              logo={logo}
              label={t("register.logoOptional")}
              removeLabel={t("register.logoRemove")}
              onPick={(file) => void pickLogo(file)}
              onClear={() => setLogo(null)}
            />
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>

            {position === "management" && plan === "company" ? (
              <>
                <div>
                  <Label>Company name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Phangan Properties Co."
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t("register.yourRole")}</p>
                  <div className="mt-2 grid gap-2">
                    <Choice
                      icon={<PulseIcon name="properties" className="size-5" />}
                      title={t("register.seatOwner")}
                      description={t("register.seatOwnerHint")}
                      active={companySeat === "owner"}
                      onClick={() => {
                        setCompanySeat("owner");
                        setPayer("owner");
                      }}
                    />
                    <Choice
                      icon={<PulseIcon name="contacts" className="size-5" />}
                      title={t("register.seatManager")}
                      description={t("register.seatManagerHint")}
                      active={companySeat === "manager"}
                      onClick={() => {
                        setCompanySeat("manager");
                        setPayer("manager");
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-canvas-deep/60 p-3">
                  <p className="text-sm font-semibold text-ink">{t("register.whoPays")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {t("register.billingInactive")}{" "}
                    <a
                      href="https://www.pulseflow.site/#plans"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary"
                    >
                      {t("register.seePlans")}
                    </a>
                  </p>
                  <div
                    className="pointer-events-none mt-2 grid select-none grid-cols-2 gap-2 opacity-55"
                    aria-disabled="true"
                  >
                    <ChipButton active={false} label={t("register.whoPaysOwner")} onClick={() => undefined} />
                    <ChipButton active={false} label={t("register.whoPaysManager")} onClick={() => undefined} />
                  </div>
                </div>
              </>
            ) : null}

            {position === "management" && plan === "personal" ? (
              <div>
                <Label>Workspace name (optional)</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Sam's properties"
                />
              </div>
            ) : null}

            {position === "staff" ? (
              <div>
                <Label>{t("register.availability")}</Label>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder={prosT(locale, "regWhenHint")}
                />
              </div>
            ) : null}

            {position === "staff" ? (
              <div>
                <Label>{t("register.companyInvite")}</Label>
                <Input
                  value={companyInvite}
                  onChange={(e) => setCompanyInvite(e.target.value)}
                  placeholder={t("register.companyInvitePlaceholder")}
                  autoComplete="off"
                  inputMode="url"
                  required
                />
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t("register.companyInviteNote")}{" "}
                  <a href={MARKETPLACE_ORIGIN} className="font-semibold text-primary">
                    {t("register.companyInviteHere")}
                  </a>.
                </p>
              </div>
            ) : null}

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
            {position === "management" ? (
              <p className="text-xs leading-relaxed text-muted">
                By creating an account you agree to the Pulse Flow{" "}
                <Link href="/terms" className="font-semibold text-primary">Terms</Link>
                {" and "}
                <Link href="/privacy" className="font-semibold text-primary">Privacy</Link>.
              </p>
            ) : null}
            {position === "staff" && !listOnServices ? (
              <p className="text-xs leading-relaxed text-muted">
                By creating an account you agree to the Pulse Flow{" "}
                <Link href="/terms" className="font-semibold text-primary">Terms</Link>
                {" and "}
                <Link href="/privacy" className="font-semibold text-primary">Privacy</Link>.
              </p>
            ) : null}
            {position === "staff" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-card px-3 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={listOnServices}
                  onChange={(e) => setListOnServices(e.target.checked)}
                />
                <span className="font-semibold">{t("register.listOnServices")}</span>
              </label>
            ) : null}
            {position === "staff" && listOnServices ? (
              <LegalAccept
                audience="staff"
                accepted={accepted}
                onAccepted={setAccepted}
                emails={emails}
                onEmails={setEmails}
              />
            ) : null}
            <Button
              className="w-full"
              busy={saving}
              disabled={position === "staff" && listOnServices && !accepted}
              onClick={() => void submitApp()}
            >
              {saving ? "Creating…" : "Create account"}
            </Button>
          </Card>
        ) : null}

        {ready && onServices && !confirmTo ? (
          <p className="mt-4 text-center text-sm text-muted">
            {prosT(locale, "regPropertyOps")}{" "}
            <a href={appHref} className="font-semibold text-primary">
              {prosT(locale, "regOpenApp")}
            </a>
          </p>
        ) : null}
        {ready && !onServices && !confirmTo ? (
          <p className="mt-4 text-center text-sm text-muted">
            {t("register.lookingForServices")}{" "}
            <a href={servicesHref} className="font-semibold text-primary">
              {t("register.goToServices")}
            </a>
          </p>
        ) : null}
        <p className="mt-2 text-center text-sm text-muted">
          {onServices ? prosT(locale, "alreadyHave") : "Already have an account?"}{" "}
          <Link
            href={onServices ? "/start?mode=sign-in&next=/" : "/login"}
            className="font-semibold text-primary"
          >
            {onServices ? prosT(locale, "signIn") : "Sign in"}
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
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border text-start transition",
        compact ? "px-2.5 py-2" : "px-3 py-3",
        active ? "border-primary bg-primary/10" : "border-[var(--color-border)] bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 font-semibold text-ink",
          compact ? "text-sm leading-snug" : "",
        )}
      >
        <span className="shrink-0 text-primary">{icon}</span>
        <span className="min-w-0">{title}</span>
      </div>
      <p className={cn("text-xs leading-snug text-muted", compact ? "mt-0.5 line-clamp-2" : "mt-1")}>
        {description}
      </p>
    </button>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold",
        active ? "bg-primary text-white" : "bg-canvas-deep text-ink",
      )}
    >
      {label}
    </button>
  );
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-3 text-sm font-semibold",
        active ? "border-primary bg-primary/10 text-ink" : "border-[var(--color-border)] bg-card text-ink",
      )}
    >
      {label}
    </button>
  );
}
