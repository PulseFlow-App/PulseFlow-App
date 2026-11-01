"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { readPhoto } from "@/components/pros/parts";
import { ProsProvider, usePros } from "@/lib/pros/store";
import { PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import { allAreas, allCategories } from "@/lib/pros/matching";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import type { ProProfile } from "@/lib/pros/types";

function Editor() {
  const params = useSearchParams();
  const data = useData();
  const { locale } = useI18n();
  const { state, ready, actor, actorReady, t, saveProfile, deleteProfile } = usePros();
  const contactId = params.get("contactId");
  const contact = data.contacts.find((row) => row.id === contactId) ?? null;
  const existing = state.profiles.find((row) => row.contactId && row.contactId === contactId);
  const categories = allCategories(state).filter((c) => c.active);
  const areas = allAreas(state).filter((a) => a.level === "district" || a.level === "locality");
  const [draft, setDraft] = useState<ProProfile | null>(null);
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    if (!ready || !actorReady || draft) return;
    if (contactId && !data.ready) return;
    const line = contact?.messengers.find((m) => m.kind === "line")?.handle ?? null;
    const whatsapp = contact?.messengers.some((m) => m.kind === "whatsapp") ? contact.phone : null;
    setConsent(Boolean(existing?.consentAt));
    setDraft(
      existing ?? {
        id: crypto.randomUUID(),
        contactId: contact?.id ?? null,
        orgId: actor?.orgId ?? contact?.org_id ?? null,
        linkedProfileId: contact?.linked_profile_id ?? null,
        name: contact?.name ?? "",
        description: "",
        descriptionLocale: locale,
        translations: {},
        photoUrl: null,
        photos: [],
        categoryIds: [],
        areaIds: state.placeId ? [state.placeId] : [],
        languages: [locale],
        phone: contact?.phone ?? null,
        lineId: line,
        whatsapp,
        visibility: "private",
        status: "active",
        available: true,
        consentAt: null,
        consentBy: null,
        consentNote: null,
        claimToken: crypto.randomUUID(),
        claimedAt: null,
        listingTier: "free",
        checks: { email: null, phone: null, identity: null, business: null, qualification: null },
        createdAt: new Date().toISOString(),
      },
    );
  }, [ready, actorReady, draft, existing, contact, contactId, data.ready, actor?.orgId, locale, state.placeId]);
  const [message, setMessage] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  if (!draft) return null;

  const toggle = (key: "categoryIds" | "areaIds" | "languages", value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  return (
    <form
      className="mx-auto max-w-lg space-y-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        const result = saveProfile(
          { ...draft, consentNote: consent ? draft.consentNote || "Consent recorded by the manager." : null },
          consent || Boolean(existing?.consentAt),
        );
        if (!result.ok) {
          setMessage(t("consentRequired"));
          return;
        }
        setMessage(t("saved"));
        setClaimUrl(`${window.location.origin}/pros/claim/${draft.claimToken}`);
      }}
    >
      <h1 className="font-display text-2xl font-semibold text-ink">{t("makeProfile")}</h1>
      <div>
        <Label>{t("name")}</Label>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="min-h-12" required />
      </div>
      <div>
        <Label>{t("about")}</Label>
        <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4} />
      </div>
      <div>
        <Label>{t("category")}</Label>
        <div className="space-y-1">
          {categories.map((cat) => (
            <label key={cat.id} className="flex min-h-12 items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.categoryIds.includes(cat.id)} onChange={() => toggle("categoryIds", cat.id)} />
              {localizedName(cat.names, locale)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>{t("areas")}</Label>
        <div className="space-y-1">
          {areas.map((area) => (
            <label key={area.id} className="flex min-h-12 items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.areaIds.includes(area.id)} onChange={() => toggle("areaIds", area.id)} />
              {localizedName(area.names, locale)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>{t("languages")}</Label>
        <div className="flex flex-wrap gap-3">
          {PROS_LANGS.map((lang) => (
            <label key={lang} className="flex min-h-12 items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.languages.includes(lang)} onChange={() => toggle("languages", lang)} />
              {lang}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>{t("visibility")}</Label>
        <Select
          value={draft.visibility}
          onChange={(e) => setDraft({ ...draft, visibility: e.target.value as ProProfile["visibility"] })}
          className="min-h-12"
        >
          <option value="private">{t("private")}</option>
          <option value="public">{t("public")}</option>
        </Select>
      </div>
      <label className="flex min-h-12 items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} />
        {t("available")}
      </label>
      <div>
        <Label>{t("photos")}</Label>
        <p className="mb-1 text-xs text-muted">{t("photosMax")}</p>
        <Input
          type="file"
          accept="image/*"
          className="min-h-12"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void readPhoto(file).then((url) => {
              if (url) {
                setDraft((prev) =>
                  prev ? { ...prev, photos: [...prev.photos, url].slice(0, 3) } : prev,
                );
              }
            });
          }}
        />
      </div>
      <label className="flex min-h-12 items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        {t("consent")}
      </label>
      {message ? <p className="text-sm text-ink">{message}</p> : null}
      {claimUrl ? <p className="break-all text-sm text-sky">{claimUrl}</p> : null}
      <Button type="submit" className="min-h-12 w-full">
        {t("save")}
      </Button>
      {existing ? (
        <Button
          type="button"
          variant="danger"
          className="min-h-12 w-full"
          reflectGlobalBusy={false}
          onClick={() => deleteProfile(existing.id)}
        >
          {t("deleteProfile")}
        </Button>
      ) : null}
    </form>
  );
}

export default function ProsProfilePage() {
  return (
    <ProsProvider>
      <Suspense>
        <Editor />
      </Suspense>
    </ProsProvider>
  );
}
