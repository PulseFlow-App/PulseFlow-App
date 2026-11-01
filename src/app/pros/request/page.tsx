"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RequireUser, readPhoto } from "@/components/pros/parts";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import { allCategories } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import type { ProsUrgency } from "@/lib/pros/types";
import { orderAllowance, SERVICES_PAYMENTS_ENABLED } from "@/lib/pros/trial";

function RequestInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state, actor, t, createRequest } = usePros();
  const { locale } = useI18n();
  const categories = allCategories(state).filter((c) => c.active);
  const invited = state.profiles.find((pro) => pro.id === params.get("profile") && pro.status === "active");
  const [categoryId, setCategoryId] = useState(params.get("category") ?? categories[0]?.id ?? "");
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [description, setDescription] = useState(params.get("brief") ?? "");
  const [urgency, setUrgency] = useState<ProsUrgency>("flexible");
  const [preferredTime, setPreferredTime] = useState("");
  const [language, setLanguage] = useState<string>(locale);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const gate = actor ? orderAllowance(state.requests, state.reviews, actor.id) : null;

  return (
    <RequireUser>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const result = createRequest({
            categoryId,
            title,
            description,
            photos,
            areaId: state.placeId,
            urgency,
            preferredTime,
            language,
            taskId: params.get("taskId"),
            orgId: params.get("orgId") ?? actor?.orgId ?? null,
            villaId: params.get("villaId"),
            invitedProfileId: invited?.id ?? null,
          });
          if (!result.ok) {
            setError(
              result.error === "rate"
                ? t("rateLimit")
                : result.error === "duplicate"
                  ? t("duplicate")
                  : result.error === "review"
                    ? t("reviewRequired")
                    : result.error === "finish"
                      ? t("finishOrderFirst")
                      : result.error === "plan"
                        ? t("planRequired")
                        : result.error === "missing"
                        ? t("notAvailable")
                        : t("tooShort"),
            );
            return;
          }
          router.push(servicesPath(pathname, `/requests/${result.id}`));
        }}
      >
        <h1 className="font-display text-2xl font-semibold text-ink">{t("sendRequest")}</h1>
        {gate?.ok && gate.via === "monthly" ? <p className="text-sm text-muted">{t("monthlyNote")}</p> : null}
        {gate?.ok && gate.via === "trial" ? <p className="text-sm text-muted">{t("trialNote")}</p> : null}
        {gate?.ok && gate.via === "plan" && !SERVICES_PAYMENTS_ENABLED ? (
          <p className="text-sm text-muted">{t("billingLater")}</p>
        ) : null}
        {gate && !gate.ok ? (
          <p className="text-sm text-danger">
            {gate.error === "plan" ? t("planRequired") : gate.error === "review" ? t("reviewRequired") : t("finishOrderFirst")}
          </p>
        ) : null}
        {params.get("taskId") ? <p className="text-sm text-muted">{t("fromTask")}</p> : null}
        {invited ? <p className="text-sm text-ink">{t("directTo", { name: invited.name })}</p> : null}
        <div>
          <Label>{t("category")}</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="min-h-12">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizedName(cat.names, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("title")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-12" required />
        </div>
        <div>
          <Label>{t("description")}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
        </div>
        <div>
          <Label>{t("photos")}</Label>
          <p className="mb-1 text-xs text-muted">{t("photosMax")}</p>
          <Input
            type="file"
            accept="image/*"
            className="min-h-12"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || photos.length >= 3) return;
              void readPhoto(file).then((url) => {
                if (url) setPhotos((prev) => [...prev, url].slice(0, 3));
              });
            }}
          />
        </div>
        <div>
          <Label>{t("urgency")}</Label>
          <Select value={urgency} onChange={(e) => setUrgency(e.target.value as ProsUrgency)} className="min-h-12">
            <option value="today">{t("today")}</option>
            <option value="this_week">{t("thisWeek")}</option>
            <option value="flexible">{t("flexible")}</option>
          </Select>
        </div>
        <div>
          <Label>{t("preferredTime")}</Label>
          <Input value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="min-h-12" />
        </div>
        <div>
          <Label>{t("yourLanguage")}</Label>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="min-h-12">
            {PROS_LANGS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <p className="text-xs text-muted">{t("terms")}</p>
        <Button type="submit" className="min-h-12 w-full" disabled={Boolean(gate && !gate.ok)}>
          {t("submit")}
        </Button>
      </form>
    </RequireUser>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestInner />
    </Suspense>
  );
}
