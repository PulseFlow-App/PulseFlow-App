"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { ServicesMark } from "@/components/brand/services-mark";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import type { UserRole } from "@/lib/design-tokens";
import { isDemoMode } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
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

type Track = "maintenance" | "management" | "customer";
type Plan = "personal" | "company";
type CompanySeat = Extract<UserRole, "owner" | "manager">;

function catalogName(names: { en: string }, locale: string) {
  const bag = names as Record<string, string>;
  return bag[locale] ?? names.en;
}

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "th", label: "ไทย" },
  { id: "ru", label: "Русский" },
  { id: "he", label: "עברית" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [track, setTrack] = useState<Track | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
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
  const [servicesHref, setServicesHref] = useState("/");
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
    const trackParam = params.get("track");
    if (trackParam === "maintenance" || (trackParam === "management" && !services)) {
      setTrack(trackParam);
    }
  }, []);

  const islands = useMemo(
    () => AREAS.filter((area) => area.level === "locality"),
    [],
  );
  const youPay =
    plan === "company" &&
    companySeat != null &&
    payer != null &&
    companySeat === payer;

  const toggle = (list: string[], id: string, set: (next: string[]) => void) => {
    set(list.includes(id) ? list.filter((row) => row !== id) : [...list, id]);
  };

  const submit = async () => {
    setError(null);
    if (!track) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Name, email, and a password (6+ chars) are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if ((track === "maintenance" || track === "customer") && !accepted) {
      setError(prosT(locale, "legalNeedScroll"));
      return;
    }
    const termsAcceptedAt = new Date().toISOString();
    if (track === "management" && plan === "company") {
      if (!orgName.trim()) {
        setError("Company name is required.");
        return;
      }
      if (!companySeat || !payer) {
        setError(t("register.seatRequired"));
        return;
      }
    }
    if (track === "maintenance") {
      if (!whatsapp.trim() && !lineId.trim()) {
        setError(t("register.contactEither"));
        return;
      }
      if (!categoryIds.length || !areaIds.length) {
        setError(t("register.needProfession"));
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
            termsAcceptedAt,
            emailOptIn: emails,
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          const message = payload.error ?? "Could not register.";
          if (/supabase|demo/i.test(message)) {
            saveServicesCustomer({ name: fullName, email, termsAcceptedAt, emailOptIn: emails });
            router.replace("/");
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
        router.replace("/");
        router.refresh();
        return;
      }

      let createdListing: string | null = null;
      if (track === "maintenance") {
        createdListing = joinProfessional({
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
        }).id;
        setListingId(createdListing);
      } else if (plan) {
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

      if (isDemoMode()) {
        if (track === "maintenance") return;
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
            kind: track === "maintenance" || plan === "personal" ? "personal" : "company",
            role: track === "maintenance" ? undefined : plan === "company" ? companySeat : "owner",
            payer: plan === "company" ? payer : undefined,
            track,
            referredBy: referralCode,
            acquisitionSource,
            termsAcceptedAt,
            emailOptIn: emails,
            service:
              track === "maintenance"
                ? {
                    skills: talentSkillsForCategories(categoryIds),
                    bio: availability.trim() ? `Available: ${availability.trim()}` : "",
                    location: areaLabels(areaIds).join(", "),
                    country: "Thailand",
                    listNow: false,
                  }
                : undefined,
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Could not register.");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
      });
      router.replace(track === "maintenance" ? "/settings" : "/setup-passkey");
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
      <div className="mx-auto w-full max-w-lg animate-rise">
        <div className="mb-4 flex items-center justify-end gap-1.5">
          <LanguageSwitcher variant="inline" />
          <ThemeIconToggle />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex justify-center">
            {ready && onServices ? <ServicesMark className="size-12" /> : <PulseMark className="size-12" />}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("register.accountTitle")}
          </h1>
        </div>

        {ready ? (
        <div className="grid grid-cols-2 gap-3">
          <Choice
            icon={<ServicesMark className="size-7" />}
            title={t("register.maintenance")}
            description={t("register.maintenanceHint")}
            active={track === "maintenance"}
            onClick={() => {
              setTrack("maintenance");
              setPlan(null);
              setError(null);
              setListingId(null);
              setAccepted(false);
            }}
          />
          {onServices ? (
            <Choice
              icon={<PulseIcon name="search" className="size-5" />}
              title={t("register.seeking")}
              description={t("register.seekingHint")}
              active={track === "customer"}
              onClick={() => {
                setTrack("customer");
                setPlan(null);
                setError(null);
                setListingId(null);
                setAccepted(false);
              }}
            />
          ) : (
            <Choice
              icon={<PulseIcon name="properties" className="size-5" />}
              title={t("register.management")}
              description={t("register.managementHint")}
              active={track === "management"}
              onClick={() => {
                setTrack("management");
                setError(null);
                setListingId(null);
                setAccepted(false);
              }}
            />
          )}
        </div>
        ) : null}

        {track === "management" ? (
          <div className="mt-3 grid gap-3">
            <Choice
              icon={<PulseIcon name="home" className="size-5" />}
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
              icon={<PulseIcon name="properties" className="size-5" />}
              title={t("register.companyPlan")}
              description={t("register.companyPlanHint")}
              active={plan === "company"}
              onClick={() => setPlan("company")}
            />
          </div>
        ) : null}

        {track === "maintenance" || track === "customer" || (track === "management" && plan) ? (
          <Card className="mt-4 space-y-2 p-4">
            {listingId ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">{t("register.savedListing")}</p>
                <p className="text-sm text-muted">
                  The listing stays hidden until you open it.
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" type="button" onClick={() => router.push(`/pros/p/${listingId}`)}>
                    View profile
                  </Button>
                  <Button className="flex-1" variant="secondary" type="button" onClick={() => router.push("/pros/find")}>
                    Directory
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {track === "maintenance" ? (
                  <p className="font-display text-lg font-semibold text-ink">
                    {t("register.maintenanceLead")}
                  </p>
                ) : null}
                {track === "customer" ? (
                  <p className="font-display text-lg font-semibold text-ink">
                    {t("register.seeking")}
                  </p>
                ) : null}
                <div>
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                {track !== "customer" ? (
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                  </div>
                ) : null}

                {track === "maintenance" ? (
                  <>
                    <p className="text-xs leading-relaxed text-muted">{t("register.contactEither")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>{t("register.whatsapp")}</Label>
                        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("register.line")}</Label>
                        <Input value={lineId} onChange={(e) => setLineId(e.target.value)} />
                      </div>
                    </div>
                    <fieldset>
                      <legend className="text-sm font-semibold text-ink">{t("register.trades")}</legend>
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
                      <legend className="text-sm font-semibold text-ink">{t("register.areas")}</legend>
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
                      <legend className="text-sm font-semibold text-ink">{t("register.languages")}</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {LANGUAGES.map((language) => (
                          <Chip
                            key={language.id}
                            active={languages.includes(language.id)}
                            label={language.label}
                            onClick={() => toggle(languages, language.id, setLanguages)}
                          />
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <Label>{t("register.availability")}</Label>
                      <Input
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="Weekdays, or call the day before"
                      />
                    </div>
                  </>
                ) : null}

                {plan === "company" ? (
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
                          onClick={() => setCompanySeat("owner")}
                        />
                        <Choice
                          icon={<PulseIcon name="contacts" className="size-5" />}
                          title={t("register.seatManager")}
                          description={t("register.seatManagerHint")}
                          active={companySeat === "manager"}
                          onClick={() => setCompanySeat("manager")}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{t("register.whoPays")}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <ChipButton active={payer === "owner"} label={t("register.whoPaysOwner")} onClick={() => setPayer("owner")} />
                        <ChipButton active={payer === "manager"} label={t("register.whoPaysManager")} onClick={() => setPayer("manager")} />
                      </div>
                    </div>
                  </>
                ) : null}

                {plan === "personal" ? (
                  <div>
                    <Label>Workspace name (optional)</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Sam's properties"
                    />
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
                {plan === "company" && companySeat && payer ? (
                  <p className="text-xs text-muted">
                    {youPay ? (
                      <>
                        {t("register.trialNow")}{" "}
                        <Link href="/terms" className="font-semibold text-primary">Terms</Link>
                        {" and "}
                        <Link href="/privacy" className="font-semibold text-primary">Privacy</Link>.
                      </>
                    ) : (
                      t("register.limitedUntil")
                    )}
                  </p>
                ) : null}
                {track === "management" && !(plan === "company" && youPay) ? (
                  <p className="text-xs leading-relaxed text-muted">
                    By creating an account you agree to the Pulse Flow{" "}
                    <Link href="/terms" className="font-semibold text-primary">Terms</Link>
                    {" and "}
                    <Link href="/privacy" className="font-semibold text-primary">Privacy</Link>.
                  </p>
                ) : null}
                {track === "maintenance" || track === "customer" ? (
                  <LegalAccept
                    audience={track === "maintenance" ? "staff" : "customer"}
                    accepted={accepted}
                    onAccepted={setAccepted}
                    emails={emails}
                    onEmails={setEmails}
                  />
                ) : null}
                <Button className="w-full" busy={saving} disabled={(track === "maintenance" || track === "customer") && !accepted} onClick={() => void submit()}>
                  {saving ? "Creating…" : "Create account"}
                </Button>
              </>
            )}
          </Card>
        ) : null}

        {ready && onServices ? (
          <p className="mt-4 text-center text-sm text-muted">
            Platform for property operations{" "}
            <a href={appHref} className="font-semibold text-primary">Click here</a>
          </p>
        ) : null}
        {ready && !onServices ? (
          <p className="mt-4 text-center text-sm text-muted">
            Looking for house maintenance services specifically?{" "}
            <a href={servicesHref} className="font-semibold text-primary">Click here</a>
          </p>
        ) : null}
        <p className="mt-2 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">Sign in</Link>
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
        "rounded-2xl border px-3 py-3 text-start transition",
        active ? "border-primary bg-primary/10" : "border-[var(--color-border)] bg-card",
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
