"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { List, Map as MapIcon, MapPin, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { StarsDisplay } from "@/components/endorsements/stars";
import { useData } from "@/lib/data/use-app-data";
import { canBrowseTalent } from "@/lib/roles";
import {
  formatTalentPlace,
  TALENT_SKILLS,
  type TalentSearchResult,
} from "@/lib/talent";
import {
  countryLabelKey,
  findTalentCountry,
  findTalentPlace,
  placeLabelKey,
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

const TalentMap = dynamic(
  () =>
    import("@/components/talent/talent-map").then((m) => m.TalentMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-canvas-deep text-sm text-muted">
        …
      </div>
    ),
  },
);

export default function TalentPage() {
  const data = useData();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBrowse = data.profile
    ? canBrowseTalent(data.profile.role, data.orgKind)
    : false;

  const load = useCallback(async () => {
    if (!canBrowse) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (skill) params.set("skill", skill);
      if (location.trim()) params.set("location", location.trim());
      if (country.trim()) params.set("country", country.trim());
      if (near) {
        params.set("near_lat", String(near.lat));
        params.set("near_lng", String(near.lng));
        params.set("radius_km", "120");
      }
      const res = await fetch(`/api/talent/search?${params.toString()}`);
      const payload = (await res.json()) as {
        results?: TalentSearchResult[];
        countries?: string[];
        locations?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? "Search failed");
      setResults(payload.results ?? []);
      if (payload.countries) setCountries(payload.countries);
      if (payload.locations) setLocations(payload.locations);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [canBrowse, query, skill, location, country, near, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const skillLabel = useMemo(
    () =>
      Object.fromEntries(
        TALENT_SKILLS.map((s) => [s, t(`talent.skill.${s}` as MessageKey)]),
      ) as Record<string, string>,
    [t],
  );

  const labelCountry = useCallback(
    (value: string) => {
      const key = countryLabelKey(value);
      return key ? t(key) : value;
    },
    [t],
  );

  const labelPlace = useCallback(
    (value: string) => {
      const key = placeLabelKey(value);
      return key ? t(key) : value;
    },
    [t],
  );

  const countryOptions = useMemo(() => {
    const fromCatalog = TALENT_COUNTRIES.map((c) => c.canonical);
    const merged = [...new Set([...fromCatalog, ...countries])];
    return merged.sort((a, b) =>
      labelCountry(a).localeCompare(labelCountry(b), undefined, {
        sensitivity: "base",
      }),
    );
  }, [countries, labelCountry]);

  const placeOptions = useMemo(() => {
    const catalog = placesForCountry(country).map((p) => p.canonical);
    const extra = locations.filter((loc) => {
      if (findTalentPlace(loc)) return false;
      if (!country) return true;
      // Keep unknown live locations when country filter is empty or matches.
      return true;
    });
    const merged = [...new Set([...catalog, ...extra])];
    if (country) {
      const countryDef = findTalentCountry(country);
      return merged
        .filter((loc) => {
          const place = findTalentPlace(loc);
          if (place) return place.countryId === countryDef?.id;
          // Custom location strings stay visible under any country pick.
          return locations.includes(loc);
        })
        .sort((a, b) =>
          labelPlace(a).localeCompare(labelPlace(b), undefined, {
            sensitivity: "base",
          }),
        );
    }
    return merged.sort((a, b) =>
      labelPlace(a).localeCompare(labelPlace(b), undefined, {
        sensitivity: "base",
      }),
    );
  }, [country, locations, labelPlace]);

  const useNearMe = () => {
    setError(null);
    setLocating(true);
    void getDevicePosition()
      .then((pos) => {
        setNear(pos);
        setView("map");
      })
      .catch((err: unknown) => {
        const key =
          err && typeof err === "object" && "code" in err
            ? geoErrorMessageKey(err as GeolocationPositionError)
            : "talent.geoUnavailable";
        setError(t(key));
      })
      .finally(() => setLocating(false));
  };

  if (!data.ready || !data.profile) return <LoadingState />;

  if (!canBrowse) {
    return (
      <div className="space-y-4 animate-rise">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("talent.title")}
        </h1>
        <Card className="p-5 text-sm text-muted">{t("talent.forbidden")}</Card>
      </div>
    );
  }

  const fieldClass =
    "rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm leading-tight sm:px-3";

  return (
    <div className="space-y-3 animate-rise pb-4">
      <div>
        <h1 className="type-title">{t("talent.title")}</h1>
        <p className="type-meta mt-0.5">{t("talent.subtitle")}</p>
      </div>

      <Card className="space-y-2 p-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-canvas-deep px-2.5">
          <Search className="size-3.5 shrink-0 text-muted" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("talent.searchPlaceholder")}
            className={cn(fieldClass, "bg-transparent px-0 focus:ring-0")}
            aria-label={t("talent.searchPlaceholder")}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Select
            value={country}
            onChange={(e) => {
              const next = e.target.value;
              setCountry(next);
              if (location) {
                const place = findTalentPlace(location);
                const countryDef = findTalentCountry(next);
                if (
                  place &&
                  countryDef &&
                  place.countryId !== countryDef.id
                ) {
                  setLocation("");
                }
              }
            }}
            aria-label={t("talent.filterCountry")}
            className={fieldClass}
          >
            <option value="">{t("talent.allCountries")}</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {labelCountry(c)}
              </option>
            ))}
          </Select>
          <Select
            value={location}
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
            aria-label={t("talent.filterLocation")}
            className={fieldClass}
          >
            <option value="">{t("talent.allPlaces")}</option>
            {placeOptions.map((loc) => (
              <option key={loc} value={loc}>
                {labelPlace(loc)}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-[11px] text-muted">{t("talent.placeSuggestions")}</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSkill("")}
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight transition active:scale-[0.98]",
              !skill ? "bg-primary text-white" : "bg-canvas-deep text-ink",
            )}
          >
            {t("talent.allSkills")}
          </button>
          {TALENT_SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s === skill ? "" : s)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight transition active:scale-[0.98]",
                skill === s ? "bg-primary text-white" : "bg-canvas-deep text-ink",
              )}
            >
              {skillLabel[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="xs"
            variant="secondary"
            busy={locating}
            onClick={useNearMe}
          >
            <MapPin className="size-3.5" />
            {locating
              ? t("talent.geoBusy")
              : near
                ? t("talent.nearMeOn")
                : t("talent.nearMe")}
          </Button>
          {near ? (
            <Button size="xs" variant="ghost" onClick={() => setNear(null)}>
              {t("talent.clearNear")}
            </Button>
          ) : null}
          <div className="ms-auto flex gap-0.5 rounded-full bg-canvas-deep p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                view === "list" ? "bg-white text-ink shadow-sm" : "text-muted",
              )}
            >
              <List className="size-3" />
              {t("talent.viewList")}
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                view === "map" ? "bg-white text-ink shadow-sm" : "text-muted",
              )}
            >
              <MapIcon className="size-3" />
              {t("talent.viewMap")}
            </button>
          </div>
        </div>
      </Card>

      {view === "map" ? (
        <Card className="overflow-hidden p-2">
          <TalentMap results={results} center={near} />
          <p className="px-2 pb-2 pt-1 text-[11px] text-muted">
            {t("talent.mapHint")}
          </p>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : error ? (
        <Card className="p-5 text-sm font-semibold text-danger">{error}</Card>
      ) : results.length === 0 ? (
        <Card className="p-5 text-sm text-muted">{t("talent.empty")}</Card>
      ) : view === "list" ? (
        <ul className="space-y-3">
          {results.map((person) => {
            const place = formatTalentPlace(person);
            return (
              <li key={person.id}>
                <Card className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <PulseIcon name="contacts" className="size-6 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold text-ink">
                        {person.full_name}
                      </p>
                      <p className="text-sm text-muted">
                        {person.job_title?.trim() ||
                          t(`roles.${person.role}` as MessageKey)}
                      </p>
                      {place ? (
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-secondary-dark">
                          <MapPin className="size-3.5" />
                          {place}
                          {person.distance_km != null
                            ? ` · ${Math.round(person.distance_km)} km`
                            : ""}
                        </p>
                      ) : null}
                      {person.job_search_skills.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {person.job_search_skills.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-canvas-deep px-2.5 py-1 text-[11px] font-semibold text-ink"
                            >
                              {skillLabel[s] ?? s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {person.job_search_bio ? (
                        <p className="mt-2 text-sm text-ink">
                          {person.job_search_bio}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StarsDisplay
                        value={person.average_rating}
                        size="sm"
                        showValue={person.review_count > 0}
                      />
                      {person.review_count > 0 ? (
                        <span className="text-xs text-muted">
                          {t("talent.reviewCount", {
                            count: person.review_count,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">
                          {t("talent.noReviews")}
                        </span>
                      )}
                    </div>
                    <Link href={`/u/${person.share_slug}`}>
                      <Button size="sm" variant="secondary">
                        {t("talent.viewProfile")}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">
          {results.map((person) => {
            const place = formatTalentPlace(person);
            return (
              <li key={person.id}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {person.full_name}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {place ?? t("talent.noLocation")}
                      {person.distance_km != null
                        ? ` · ${Math.round(person.distance_km)} km`
                        : ""}
                    </p>
                  </div>
                  <Link href={`/u/${person.share_slug}`}>
                    <Button size="sm" variant="secondary">
                      {t("talent.viewProfile")}
                    </Button>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
