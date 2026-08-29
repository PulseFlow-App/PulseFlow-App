"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { isDemoMode } from "@/lib/supabase/client";
import { canListInTalentSearch, TALENT_SKILLS } from "@/lib/talent";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function JobSearchSettingsCard() {
  const data = useData();
  const { t } = useI18n();
  const profile = data.profile;
  const [visible, setVisible] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = profile ? canListInTalentSearch(profile.role) : false;

  useEffect(() => {
    if (!profile) return;
    setVisible(Boolean(profile.job_search_visible));
    setSkills(profile.job_search_skills ?? []);
    setBio(profile.job_search_bio ?? "");
  }, [
    profile?.id,
    profile?.job_search_visible,
    profile?.job_search_skills,
    profile?.job_search_bio,
  ]);

  const skillLabel = useMemo(
    () =>
      Object.fromEntries(
        TALENT_SKILLS.map((s) => [s, t(`talent.skill.${s}` as MessageKey)]),
      ) as Record<string, string>,
    [t],
  );

  if (!eligible || !profile) return null;

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
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
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary-dark">
          <Briefcase className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("talent.settingsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("talent.settingsHint")}</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-[#F7F5F1] px-3 py-3">
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
                  active ? "bg-primary text-white" : "bg-[#F7F5F1] text-ink",
                )}
              >
                {skillLabel[skill]}
              </button>
            );
          })}
        </div>
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

      <Button className="w-full" disabled={saving} onClick={() => void save()}>
        {saving ? t("common.loading") : t("talent.settingsSave")}
      </Button>

      {message ? (
        <p className="text-sm font-semibold text-secondary">{message}</p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
    </Card>
  );
}
