"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { ServicesMark } from "@/components/brand/services-mark";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { AddToHomeScreenModal } from "@/components/pwa/add-to-home-screen-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
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
import { LegalAccept } from "@/components/pros/legal-accept";
import { prosT } from "@/lib/pros/i18n";
import { saveServicesCustomer } from "@/lib/pros/trial";
import {
  areaLabels,
  joinProfessional,
  recordSignup,
  talentSkillsForCategories,
} from "@/lib/pros/join";

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

async function signInWithPassword(email: string, password: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const { error } = await createClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return error;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
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
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [availability, setAvailability] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emails, setEmails] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
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
  const showAppForm = ready && !onServices && (position === "staff" || plan != null);
  const showServicesForm = ready && onServices && track != null;

  const toggle = (list: string[], id: string, set: (next: string[]) => void) => {
    set(list.includes(id) ? list.filter((row) => row !== id) : [...list, id]);
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
      if (!whatsapp.trim() && !lineId.trim()) {
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
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          const message = payload.error ?? prosT(locale, "regFailed");
          if (/supabase|demo/i.test(message)) {
            saveServicesCustomer({ name: fullName, email, termsAcceptedAt, emailOptIn: emails });
            router.replace("/");
            return;
          }
          if (!existingAccount(message)) throw new Error(message);
        }
        const signInError = await signInWithPassword(email, password);
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
            whatsapp,
            lineId,
            description: "",
            availability,
            categoryIds,
            areaIds,
            languages,
            listNow: false,
            referrer: referralCode,
            emailOptIn: emails,
            termsAcceptedAt,
          }).id,
        );
        return;
      }

      const { withActionBusy } = await import("@/lib/ui/action-busy");
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
            service: {
              skills: talentSkillsForCategories(categoryIds),
              bio: availability.trim() ? `Available: ${availability.trim()}` : "",
              location: areaLabels(areaIds).join(", "),
              country: "Thailand",
              listNow: false,
            },
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok && !existingAccount(payload.error ?? "")) {
          throw new Error(payload.error ?? prosT(locale, "regFailed"));
        }
        const signInError = await signInWithPassword(email, password);
        if (signInError) {
          throw new Error(
            existingAccount(payload.error ?? "")
              ? prosT(locale, "existingAccountPassword")
              : signInError.message,
          );
        }
      });
      joinProfessional({
        name: fullName,
        email,
        phone,
        whatsapp,
        lineId,
        description: "",
        availability,
        categoryIds,
        areaIds,
        languages,
        listNow: false,
        referrer: referralCode,
        emailOptIn: emails,
        termsAcceptedAt,
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
          availability: "",
          categoryIds: [],
          areaIds: [],
          languages: [locale],
          listNow: false,
          referrer: referralCode,
          emailOptIn: emails,
          termsAcceptedAt,
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
            service: onSite
              ? {
                  skills: ["maintenance"],
                  listNow: false,
                }
              : undefined,
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Could not register.");
        const { createClient } = await import("@/lib/supabase/client");
        const { error: signInError } = await createClient().auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
      });
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
          {ready && onServices ? (
            <Link href="/" aria-label={prosT(locale, "home")} className="inline-flex items-center">
              <ServicesMark className="size-12" />
            </Link>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher variant="inline" locales={onServices && track === "maintenance" ? STAFF_LOCALES : undefined} />
            <ThemeIconToggle />
          </div>
        </div>
        <div className="mb-6 text-center">
          {ready && !onServices ? (
            <div className="mx-auto mb-3 flex justify-center">
              <PulseMark className="size-12" />
            </div>
          ) : null}
          <h1 className="font-display text-2xl font-bold text-ink">
            {onServices ? prosT(locale, "regAccountTitle") : t("register.accountTitle")}
          </h1>
        </div>

        {ready && onServices && !track ? (
          <p className="text-center text-sm text-muted">
            <Link href="/" className="font-semibold text-ink">
              {prosT(locale, "registerPickSide")}
            </Link>
          </p>
        ) : null}

        {/* App host: two cards first; personal/company only after management */}
        {ready && !onServices ? (
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
                <Link href="/" aria-label={prosT(locale, "home")} className="inline-flex min-h-11 items-center">
                  <ServicesMark className="size-10" />
                </Link>
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
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder={prosT(locale, "whatsapp")}
                        />
                      </div>
                      <div>
                        <Label>{prosT(locale, "line")}</Label>
                        <Input
                          value={lineId}
                          onChange={(e) => setLineId(e.target.value)}
                          placeholder={prosT(locale, "line")}
                        />
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
                      <div className="mt-2 space-y-2">
                        {islands.map((island) => (
                          <div key={island.id}>
                            <p className="text-xs font-semibold text-muted">{catalogName(island.names, locale)}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Chip
                                active={areaIds.includes(island.id)}
                                label={catalogName(island.names, locale)}
                                onClick={() => toggle(areaIds, island.id, setAreaIds)}
                              />
                              {AREAS.filter((area) => area.parentId === island.id).map((area) => (
                                <Chip
                                  key={area.id}
                                  active={areaIds.includes(area.id)}
                                  label={catalogName(area.names, locale)}
                                  onClick={() => toggle(areaIds, area.id, setAreaIds)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
                <Button className="w-full" busy={saving} disabled={!accepted} onClick={() => void submitServices()}>
                  {saving ? prosT(locale, "regCreating") : prosT(locale, "regCreate")}
                </Button>
              </>
            )}
          </Card>
        ) : null}

        {showAppForm ? (
          <Card className="mt-4 space-y-2 p-4">
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

            {position === "staff" ? (
              <div className="space-y-2 rounded-2xl bg-canvas-deep p-3">
                <label className="flex items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[var(--color-primary)]"
                    checked={listOnServices}
                    onChange={(e) => setListOnServices(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold">{t("register.listOnServices")}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {t("register.listOnServicesHint")}{" "}
                      <a
                        href={MARKETING_SERVICES}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary"
                      >
                        {t("register.whatIsServices")}
                      </a>
                    </span>
                  </span>
                </label>
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

        {ready && onServices ? (
          <p className="mt-4 text-center text-sm text-muted">
            {prosT(locale, "regPropertyOps")}{" "}
            <a href={appHref} className="font-semibold text-primary">
              {prosT(locale, "regOpenApp")}
            </a>
          </p>
        ) : null}
        {ready && !onServices ? (
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
        "rounded-full px-3 py-1.5 text-xs font-semibold",
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
