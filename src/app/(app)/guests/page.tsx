"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import type { GuestBriefingCategory } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CATEGORIES: GuestBriefingCategory[] = [
  "check_in",
  "keys",
  "emergency",
  "app_help",
  "house",
  "custom",
];

export default function GuestsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const router = useRouter();
  const [stayId, setStayId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<GuestBriefingCategory>("custom");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canManage =
    data.profile?.role === "owner" || data.profile?.role === "manager";

  const stays = useMemo(
    () =>
      data.guestStays
        .filter((s) => s.status === "active" || s.status === "upcoming")
        .sort(
          (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
        ),
    [data.guestStays],
  );

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (!canManage) router.replace("/home");
  }, [data.ready, data.profile, canManage, router]);

  useEffect(() => {
    if (!stayId && stays[0]) setStayId(stays[0].id);
  }, [stayId, stays]);

  if (!data.ready || !data.profile) return <LoadingState />;
  if (!canManage) return <LoadingState />;

  const activeId = stayId ?? stays[0]?.id ?? null;
  const activeStay = stays.find((s) => s.id === activeId) ?? null;
  const briefings = data.guestBriefings.filter((b) => b.stay_id === activeId);
  const pendingDates = data.stayDateRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const sendBriefing = async () => {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await data.createGuestBriefing({
        stay_id: activeId,
        title,
        body,
        category,
      });
      setTitle("");
      setBody("");
      setCategory("custom");
      setOk(t("guests.briefingSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guests.title")}
        </h1>
        <p className="text-sm text-muted">{t("guests.subtitle")}</p>
      </div>

      {pendingDates > 0 ? (
        <Link
          href="/date-requests"
          className="block rounded-2xl bg-primary-soft px-4 py-3 text-sm font-bold text-primary"
        >
          {t("guests.pendingDates", { count: pendingDates })}
        </Link>
      ) : null}

      {!stays.length ? (
        <EmptyState
          title={t("guests.emptyTitle")}
          description={t("guests.emptyHint")}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {stays.map((s) => {
              const guest = data.profiles.find(
                (p) => p.id === s.guest_profile_id,
              );
              const villa =
                data.villas.find((v) => v.id === s.villa_id) ??
                data.allOrgVillas.find((v) => v.id === s.villa_id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setStayId(s.id);
                    setOk(null);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    activeId === s.id
                      ? "bg-primary text-white"
                      : "bg-[#F7F5F1] text-ink",
                  )}
                >
                  {guest?.full_name ?? t("guests.guest")}
                  {villa ? ` · ${label(villa.name)}` : ""}
                </button>
              );
            })}
          </div>

          {activeStay ? (
            <Card className="space-y-2 p-4">
              <p className="text-sm text-muted">
                {formatShortDate(activeStay.check_in)} →{" "}
                {formatShortDate(activeStay.check_out)} · {activeStay.status}
              </p>
              <Link
                href="/messages"
                className="text-sm font-bold text-primary"
              >
                {t("guests.openSupport")}
              </Link>
            </Card>
          ) : null}

          <Card className="space-y-3 p-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                {t("guests.sendBriefing")}
              </p>
              <p className="text-xs text-muted">{t("guests.sendBriefingHint")}</p>
            </div>
            <div>
              <Label htmlFor="brief-title">{t("guests.briefTitle")}</Label>
              <Input
                id="brief-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("guests.briefTitlePh")}
              />
            </div>
            <div>
              <Label htmlFor="brief-body">{t("guests.briefBody")}</Label>
              <Textarea
                id="brief-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("guests.briefBodyPh")}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="brief-cat">{t("guests.category")}</Label>
              <select
                id="brief-cat"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as GuestBriefingCategory)
                }
                className="w-full appearance-none rounded-2xl border-0 bg-[#F7F5F1] px-4 py-3 text-sm text-ink outline-none ring-primary/25 focus:ring-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`guests.cat.${c}` as MessageKey)}
                  </option>
                ))}
              </select>
            </div>
            {error ? (
              <p className="text-sm font-semibold text-danger">{error}</p>
            ) : null}
            {ok ? (
              <p className="text-sm font-semibold text-secondary">{ok}</p>
            ) : null}
            <Button
              type="button"
              disabled={busy || !title.trim() || !body.trim() || !activeId}
              onClick={() => void sendBriefing()}
            >
              {busy ? t("common.saving") : t("guests.send")}
            </Button>
          </Card>

          <div className="space-y-2">
            <p className="font-display text-base font-bold text-ink">
              {t("guests.briefings")}
            </p>
            {!briefings.length ? (
              <p className="text-sm text-muted">{t("guests.noBriefings")}</p>
            ) : (
              briefings.map((b) => (
                <Card key={b.id} className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        {t(`guests.cat.${b.category}` as MessageKey)}
                      </p>
                      <p className="font-semibold text-ink">{b.title}</p>
                    </div>
                    {b.confirmed_at ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                        <CheckCircle2 className="size-3.5" />
                        {t("guests.read")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted">
                        <Circle className="size-3.5" />
                        {t("guests.unread")}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink">{b.body}</p>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
