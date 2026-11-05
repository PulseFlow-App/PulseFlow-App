"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { isWorkAccount } from "@/lib/pros/intent";
import { needsWorkPermit } from "@/lib/pros/permit";
import { servicesPath } from "@/lib/pros/paths";
import { readPhoto } from "@/components/pros/parts";
import { updateServiceListing } from "@/lib/pros/join";
import { usePros } from "@/lib/pros/store";
import { prepareVillaPhotoFile } from "@/lib/villas/prepare-photo";
import { TALENT_SKILLS, type TalentSkill } from "@/lib/talent";
import { cn } from "@/lib/utils";

type Listing = {
  id: string;
  job_search_visible: boolean;
  job_search_skills: string[] | null;
  job_search_bio: string | null;
  job_search_location: string | null;
  job_search_country: string | null;
  nationality: string | null;
  logo_url?: string | null;
};

function splitAvailability(bio: string) {
  const marked = bio.match(/\n\nAvailable: ([\s\S]*)$/);
  if (marked?.index != null) {
    return { about: bio.slice(0, marked.index).trim(), availability: marked[1].trim() };
  }
  const only = bio.match(/^Available: ([\s\S]*)$/);
  if (only) return { about: "", availability: only[1].trim() };
  return { about: bio, availability: "" };
}

export function DirectoryListingCard() {
  const { actor, t } = usePros();
  const { t: appT } = useI18n();
  const pathname = usePathname();
  const work = isWorkAccount(actor);
  const [listing, setListing] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [place, setPlace] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<TalentSkill[]>([]);
  const [nationality, setNationality] = useState("");
  const [availability, setAvailability] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || actor.role === "guest") {
      setReady(true);
      return;
    }
    let cancel = false;
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { eligible?: boolean; profile?: Listing | null } | null) => {
        if (cancel) return;
        const row = payload?.eligible ? payload.profile ?? null : null;
        setListing(row);
        if (row) {
          const parsed = splitAvailability(row.job_search_bio ?? "");
          setVisible(Boolean(row.job_search_visible));
          setPlace(row.job_search_location ?? "");
          setAbout(parsed.about);
          setAvailability(parsed.availability);
          setLogo(row.logo_url ?? null);
          setSkills(
            (row.job_search_skills ?? []).filter((skill): skill is TalentSkill =>
              (TALENT_SKILLS as readonly string[]).includes(skill),
            ),
          );
          setNationality(row.nationality ?? "");
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [actor]);

  if (!actor || actor.role === "guest") return null;
  if (!ready) {
    if (!isWorkAccount(actor)) return null;
    return (
      <section id="your-profile" className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourProfile")}</h2>
      </section>
    );
  }
  if (!listing) return null;

  const save = (nextVisible: boolean) => {
    setSaving(true);
    setNote(null);
    setError(null);
    void fetch("/api/services/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visible: nextVisible,
        bio:
          [about.trim(), availability.trim() ? `Available: ${availability.trim()}` : ""]
            .filter(Boolean)
            .join("\n\n") || null,
        location: place.trim() || null,
        ...(logo?.startsWith("data:") || logo == null ? { logo } : {}),
        country: listing.job_search_country,
        ...(work ? { skills, nationality: nationality.trim() || null } : {}),
      }),
    })
      .then(async (res) => {
        const payload = (await res.json()) as { error?: string; profile?: Listing };
        if (!res.ok || !payload.profile) throw new Error(payload.error ?? "Could not save the profile.");
        setListing(payload.profile);
        setVisible(Boolean(payload.profile.job_search_visible));
        setNationality(payload.profile.nationality ?? "");
        if ("logo_url" in payload.profile) {
          setLogo(payload.profile.logo_url ?? null);
          window.dispatchEvent(new CustomEvent("pulseflow-logo", { detail: payload.profile.logo_url ?? null }));
        }
        updateServiceListing({
          availability,
          visibility: payload.profile.job_search_visible ? "public" : "private",
          photoUrl: payload.profile.logo_url ?? logo,
        });
        setNote(payload.profile.job_search_visible ? t("profileShown") : t("profileHidden"));
        window.dispatchEvent(new Event("pros-refresh"));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not save the profile.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <section id="your-profile" className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
      <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourProfile")}</h2>
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("yourProfileBody")}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          aria-label={t("regLogo")}
          className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pf-line bg-pf-card text-pf-18 font-medium text-pf-ink"
        >
          {logo ? <img src={logo} alt="" className="size-full object-cover" /> : "+"}
        </button>
        <div>
          <p className="text-pf-14 font-medium text-pf-ink">{t("regLogo")}</p>
          {logo ? (
            <button type="button" className="mt-1 min-h-11 text-pf-14 font-medium text-pf-ink underline" onClick={() => setLogo(null)}>
              {t("regLogoRemove")}
            </button>
          ) : null}
        </div>
        <input
          ref={logoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void prepareVillaPhotoFile(file, 512)
              .then((prepared) => readPhoto(prepared))
              .then((data) => {
                if (!data) {
                  setError(t("photoTooBig"));
                  return;
                }
                setError(null);
                setLogo(data);
              })
              .catch(() => setError(t("photoTooBig")));
          }}
        />
      </div>
      {work ? (
        <label className="block space-y-1">
          <span className="text-pf-14 font-medium text-pf-ink">{t("availability")}</span>
          <Input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder={t("regWhenHint")} />
        </label>
      ) : null}
      {work ? (
        <fieldset className="space-y-2">
          <legend className="text-pf-14 font-medium text-pf-ink">{t("profileWork")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {TALENT_SKILLS.map((skill) => {
              const on = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSkills((current) =>
                      current.includes(skill) ? current.filter((row) => row !== skill) : [...current, skill],
                    )
                  }
                  className={cn(
                    "min-h-11 rounded-full px-3 text-pf-14 font-medium",
                    on ? "pf-skill-on" : "border border-pf-line bg-pf-card text-pf-ink",
                  )}
                >
                  {appT(`talent.skill.${skill}` as MessageKey)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {work ? (
        <label className="block space-y-1">
          <span className="text-pf-14 font-medium text-pf-ink">{t("nationality")}</span>
          <Input value={nationality} onChange={(event) => setNationality(event.target.value)} autoComplete="country-name" />
          <span className="block text-pf-12 leading-relaxed text-pf-slate-ink">{t("nationalityHint")}</span>
        </label>
      ) : null}
      <label className="block space-y-1">
        <span className="text-pf-14 font-medium text-pf-ink">{t("profilePlace")}</span>
        <Input value={place} onChange={(event) => setPlace(event.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-pf-14 font-medium text-pf-ink">{t("profileAbout")}</span>
        <Textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={3} />
      </label>
      {error ? <p className="text-pf-14 text-pf-danger-ink">{error}</p> : null}
      {note ? <p className="text-pf-14 font-medium text-pf-ink">{note}</p> : null}
      {work && !visible && needsWorkPermit(nationality) ? (
        <p className="text-pf-14 leading-relaxed text-pf-text-secondary">{t("permitBeforeList")}</p>
      ) : null}
      <label className="flex items-start gap-3 rounded-[20px] border border-pf-line bg-pf-card px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        <span className="text-pf-16 font-medium text-pf-ink">{t("regListMarketplace")}</span>
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => save(visible)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-60"
      >
        {t("saveProfile")}
      </button>
      {visible ? (
        <Link
          href={servicesPath(pathname, `/p/${listing.id}`)}
          className="inline-flex min-h-11 w-full items-center justify-center text-pf-16 font-medium text-pf-ink"
        >
          {t("seeProfile")}
        </Link>
      ) : null}
    </section>
  );
}
