"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { useData } from "@/lib/data/use-app-data";
import { isDemoMode } from "@/lib/supabase/client";
import { canListInTalentSearch, TALENT_SKILLS } from "@/lib/talent";
import {
  findTalentCountry,
  findTalentPlace,
  placesForCountry,
  TALENT_COUNTRIES,
} from "@/lib/talent/places";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  geoErrorMessageKey,
  getDevicePosition,
} from "@/lib/geo/device-position";

export function JobSearchSettingsCard() {
  const data = useData();
  const { t } = useI18n();
  const profile = data.profile;
  const [visible, setVisible] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = profile ? canListInTalentSearch(profile.role) : false;

  useEffect(() => {
    if (!profile) return;
    setVisible(Boolean(profile.job_search_visible));
    setSkills(profile.job_search_skills ?? []);
    setBio(profile.job_search_bio ?? "");
    setLocation(
      findTalentPlace(profile.job_search_location)?.canonical ??
        profile.job_search_location ??
        "",
    );
    setCountry(
      findTalentCountry(profile.job_search_country)?.canonical ??
        profile.job_search_country ??
        "",
    );
    setLat(profile.job_search_lat ?? null);
    setLng(profile.job_search_lng ?? null);
  }, [
    profile?.id,
    profile?.job_search_visible,
    profile?.job_search_skills,
    profile?.job_search_bio,
    profile?.job_search_location,
    profile?.job_search_country,
    profile?.job_search_lat,
    profile?.job_search_lng,
  ]);

  const skillLabel = useMemo(
    () =>
      Object.fromEntries(
        TALENT_SKILLS.map((s) => [s, t(`talent.skill.${s}` as MessageKey)]),
      ) as Record<string, string>,
    [t],
  );

  const placeChoices = useMemo(() => placesForCountry(country), [country]);

  if (!eligible || !profile) return null;

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const pinHere = () => {
    setPinning(true);
    setError(null);
    setMessage(null);
    void getDevicePosition()
      .then((pos) => {
        setLat(pos.lat);
        setLng(pos.lng);
        setMessage(t("talent.pinSet"));
      })
      .catch((err: unknown) => {
        const key =
          err && typeof err === "object" && "code" in err
            ? geoErrorMessageKey(err as GeolocationPositionError)
            : "talent.geoUnavailable";
        setError(t(key));
      })
      .finally(() => setPinning(false));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    if (isDemoMode()) {
      setError(t("talent.demoReadOnly"));
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/profile/job-search", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visible,
          skills,
          bio: bio.trim() || null,
          location: location.trim() || null,
          country: country.trim() || null,
          lat,
          lng,
          clear_pin: lat == null || lng == null,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      setMessage(t("talent.settingsSaved"));
      await data.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <PulseIcon name="search" className="mt-0.5 size-6 shrink-0" />
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("talent.settingsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("talent.settingsHint")}</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-canvas-deep px-3 py-3">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="mt-1 size-4 rounded border-black/20"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">
            {t("talent.settingsVisible")}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {t("talent.settingsVisibleHint")}
          </span>
        </span>
      </label>

      <div>
        <Label>{t("talent.settingsSkills")}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TALENT_SKILLS.map((skill) => {
            const active = skills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active ? "bg-primary text-white" : "bg-canvas-deep text-ink",
                )}
              >
                {skillLabel[skill]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="job-search-country">{t("talent.settingsCountry")}</Label>
          <Select
            id="job-search-country"
            value={
              findTalentCountry(country)?.canonical ??
              (country ? country : "")
            }
            onChange={(e) => {
              const next = e.target.value;
              setCountry(next);
              const place = findTalentPlace(location);
              const countryDef = findTalentCountry(next);
              if (
                place &&
                countryDef &&
                place.countryId !== countryDef.id
              ) {
                setLocation("");
              }
            }}
          >
            <option value="">{t("talent.allCountries")}</option>
            {TALENT_COUNTRIES.map((c) => (
              <option key={c.id} value={c.canonical}>
                {t(c.labelKey)}
              </option>
            ))}
            {country && !findTalentCountry(country) ? (
              <option value={country}>{country}</option>
            ) : null}
          </Select>
        </div>
        <div>
          <Label htmlFor="job-search-location">{t("talent.settingsLocation")}</Label>
          <Select
            id="job-search-location"
            value={
              findTalentPlace(location)?.canonical ??
              (location ? location : "")
            }
            onChange={(e) => {
              const next = e.target.value;
              setLocation(next);
              const place = findTalentPlace(next);
              if (place) {
                const countryDef = TALENT_COUNTRIES.find(
                  (c) => c.id === place.countryId,
                );
                if (countryDef) setCountry(countryDef.canonical);
              }
            }}
          >
            <option value="">{t("talent.placeSuggestions")}</option>
            {placeChoices.map((p) => (
              <option key={p.id} value={p.canonical}>
                {t(p.labelKey)}
              </option>
            ))}
            {location && !findTalentPlace(location) ? (
              <option value={location}>{location}</option>
            ) : null}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pinning}
          onClick={pinHere}
        >
          <MapPin className="size-4" />
          {pinning ? t("talent.pinning") : t("talent.pinHere")}
        </Button>
        {lat != null && lng != null ? (
          <>
            <span className="text-xs text-muted">
              {t("talent.pinActive", {
                lat: lat.toFixed(3),
                lng: lng.toFixed(3),
              })}
            </span>
            <button
              type="button"
              className="text-xs font-semibold text-danger"
              onClick={() => {
                setLat(null);
                setLng(null);
              }}
            >
              {t("talent.clearPin")}
            </button>
          </>
        ) : (
          <span className="text-xs text-muted">{t("talent.pinHint")}</span>
        )}
      </div>

      <div>
        <Label htmlFor="job-search-bio">{t("talent.settingsBio")}</Label>
        <Textarea
          id="job-search-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder={t("talent.settingsBioPlaceholder")}
        />
      </div>

      <Button className="w-full" busy={saving} onClick={() => void save()}>
        {saving ? t("common.loading") : t("talent.settingsSave")}
      </Button>

      {message ? (
        <p className="text-sm font-semibold text-secondary">{message}</p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
    </Card>
  );
}
