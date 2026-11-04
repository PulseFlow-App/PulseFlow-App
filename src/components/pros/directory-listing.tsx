"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { isWorkAccount } from "@/lib/pros/intent";
import { needsWorkPermit } from "@/lib/pros/permit";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
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
};

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
          setVisible(Boolean(row.job_search_visible));
          setPlace(row.job_search_location ?? "");
          setAbout(row.job_search_bio ?? "");
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
        bio: about.trim() || null,
        location: place.trim() || null,
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
      {work ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => save(visible)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-60"
        >
          {t("saveProfile")}
        </button>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => save(!visible)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-60"
      >
        {visible ? t("hideProfile") : t("showProfile")}
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
