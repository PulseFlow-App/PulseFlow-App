"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { readPhoto } from "@/components/pros/parts";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useAppearance } from "@/lib/appearance/provider";
import { LOCALE_META } from "@/lib/i18n";
import { AREAS, CATEGORIES, PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import {
  ensureMyServiceListing,
  isServicesWorker,
  readMyListingId,
  serviceInviteCode,
  serviceInviteUrl,
  updateServiceListing,
} from "@/lib/pros/join";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function splitAbout(description: string) {
  const about = description.replace(/\n\nAvailable:[\s\S]*$/, "").trim();
  const when = description.match(/\n\nAvailable: ([\s\S]*)$/);
  return { about, availability: when?.[1]?.trim() ?? "" };
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
        "min-h-11 rounded-full px-3 text-pf-14 font-medium",
        active ? "bg-pf-peach-100 text-pf-ink" : "border border-pf-line bg-pf-card text-pf-ink",
      )}
    >
      {label}
    </button>
  );
}

function ListingForm() {
  const { actor, t } = usePros();
  const { locale } = useI18n();
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [availability, setAvailability] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [lineId, setLineId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    const row = ensureMyServiceListing(actor);
    const parts = splitAbout(row.description);
    setName(row.name);
    setAbout(parts.about);
    setAvailability(parts.availability);
    setPhone(row.phone ?? "");
    setWhatsapp(row.whatsapp ?? "");
    setLineId(row.lineId ?? "");
    setPhotoUrl(row.photoUrl);
    setCategoryIds(row.categoryIds);
    setAreaIds(row.areaIds);
    setLanguages(row.languages.length ? row.languages : ["en"]);
    setOpen(row.visibility === "public");
    setReady(true);
  }, [actor]);

  if (!actor || !ready) return null;

  const places = AREAS.filter((area) => area.level === "locality" || area.level === "district");
  const toggle = (list: string[], id: string, set: (next: string[]) => void) => {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const ok = updateServiceListing({
          name,
          description: about,
          availability,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          lineId: lineId.trim() || null,
          photoUrl,
          categoryIds,
          areaIds,
          languages,
          visibility: open ? "public" : "private",
        });
        setNote(ok ? t("saved") : null);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-peach-100 text-pf-18 font-medium text-pf-ink">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            name.trim().slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Label htmlFor="listing-photo">{t("photo")}</Label>
          <Input
            id="listing-photo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void readPhoto(file).then((url) => {
                if (!url) {
                  setPhotoError(t("photoTooBig"));
                  return;
                }
                setPhotoError(null);
                setPhotoUrl(url);
              });
            }}
          />
        </div>
      </div>
      {photoError ? <p className="text-pf-14 font-medium text-pf-danger-ink">{photoError}</p> : null}
      <div>
        <Label htmlFor="listing-name">{t("name")}</Label>
        <Input id="listing-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="listing-about">{t("about")}</Label>
        <Textarea id="listing-about" value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
      </div>
      <div>
        <Label htmlFor="listing-when">{t("availability")}</Label>
        <Input id="listing-when" value={availability} onChange={(e) => setAvailability(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="listing-phone">{t("phone")}</Label>
        <Input id="listing-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </div>
      <div>
        <Label htmlFor="listing-wa">{t("whatsapp")}</Label>
        <Input id="listing-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="listing-line">{t("line")}</Label>
        <Input id="listing-line" value={lineId} onChange={(e) => setLineId(e.target.value)} />
      </div>
      <div>
        <p className="mb-1 text-pf-14 font-medium text-pf-ink">{t("trades")}</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter((row) => row.slug !== "other").map((row) => (
            <Chip
              key={row.id}
              active={categoryIds.includes(row.id)}
              label={localizedName(row.names, locale)}
              onClick={() => toggle(categoryIds, row.id, setCategoryIds)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-pf-14 font-medium text-pf-ink">{t("areas")}</p>
        <div className="flex flex-wrap gap-1.5">
          {places.map((row) => (
            <Chip
              key={row.id}
              active={areaIds.includes(row.id)}
              label={localizedName(row.names, locale)}
              onClick={() => toggle(areaIds, row.id, setAreaIds)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-pf-14 font-medium text-pf-ink">{t("languages")}</p>
        <div className="flex flex-wrap gap-1.5">
          {PROS_LANGS.map((lang) => (
            <Chip
              key={lang}
              active={languages.includes(lang)}
              label={LOCALE_META[lang].native}
              onClick={() => toggle(languages, lang, setLanguages)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={open} label={t("listingOpen")} onClick={() => setOpen(true)} />
        <Chip active={!open} label={t("listingHidden")} onClick={() => setOpen(false)} />
      </div>
      {note ? <p className="text-pf-14 font-medium text-pf-ink">{note}</p> : null}
      <Button type="submit" className="min-h-12 w-full">
        {t("saveListing")}
      </Button>
    </form>
  );
}

export default function ServicesSettingsPage() {
  const { actor, actorReady, plan, setPlan, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const { appearance, setAppearance } = useAppearance();
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  const [invite, setInvite] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [worker, setWorker] = useState(false);

  useEffect(() => {
    if (!actorReady || actor) return;
    router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/settings"))}`);
  }, [actor, actorReady, pathname, router, start]);

  useEffect(() => {
    if (!actor) return;
    setInvite(serviceInviteCode());
    setInviteLink(serviceInviteUrl(window.location.origin));
    setWorker(isServicesWorker() || Boolean(readMyListingId()));
  }, [actor]);

  if (!actor) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("settings")}</h1>

      {worker ? (
        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourListing")}</h2>
          <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("listingHint")}</p>
          <ListingForm />
        </section>
      ) : (
        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourListing")}</h2>
          <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("listingHint")}</p>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              ensureMyServiceListing(actor);
              setWorker(true);
            }}
          >
            {t("welcomeStaffRegister")}
          </Button>
        </section>
      )}

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("theme")}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={appearance !== "dark"} label={t("themeFrost")} onClick={() => setAppearance("frost")} />
          <Chip active={appearance === "dark"} label={t("themeDark")} onClick={() => setAppearance("dark")} />
        </div>
      </section>

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("inviteCode")}</h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("inviteHint")}</p>
        <p className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{invite}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "pro" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInvitePro")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "seeker" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInviteSeeker")}
          </Button>
        </div>
        {inviteLink ? <p className="break-all text-pf-12 text-pf-slate-ink">{inviteLink}</p> : null}
      </section>

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("planTitle")}</h2>
          {plan.premium || plan.pro ? <span className="text-pf-14 font-medium text-pf-ink">{t("planOn")}</span> : null}
        </div>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("premiumBody")}</p>
        {actor ? (
          <Button
            type="button"
            variant={plan.premium || plan.pro ? "ghost" : "primary"}
            className="min-h-12 w-full"
            onClick={() => {
              const on = !(plan.premium || plan.pro);
              setPlan({ premium: on, pro: on });
            }}
          >
            {plan.premium || plan.pro ? t("turnOff") : t("turnOn")}
          </Button>
        ) : null}
      </section>

      <p className="text-pf-12 leading-relaxed text-pf-slate-ink">{t("paymentNotCharged")}</p>
    </div>
  );
}
