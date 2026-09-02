"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  BILL_CURRENCIES,
  billCurrencyLabel,
  normalizeBillCurrency,
  type BillCurrency,
} from "@/lib/billing/currencies";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatShortDate } from "@/lib/utils";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import type { GuestBriefingCategory } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isUnpaidBeforeArrivalDeposit } from "@/lib/guest/deposit-from-quote";

const CATEGORIES: GuestBriefingCategory[] = [
  "check_in",
  "keys",
  "emergency",
  "app_help",
  "house",
  "custom",
];

function parseDepositAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, ".").trim();
  if (!cleaned) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export default function GuestsPage() {
  const data = useData();
  const { t } = useI18n();
  const { formatDisplay } = useDisplayCurrency();
  const router = useRouter();
  const [stayId, setStayId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<GuestBriefingCategory>("custom");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<BillCurrency>("THB");
  const [depositNotes, setDepositNotes] = useState("");
  const [depositDirty, setDepositDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [depositBusy, setDepositBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [depositMsg, setDepositMsg] = useState<string | null>(null);
  const [deductionDesc, setDeductionDesc] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionCurrency, setDeductionCurrency] =
    useState<BillCurrency>("THB");
  const [deductionPhotoUrl, setDeductionPhotoUrl] = useState<string | null>(
    null,
  );
  const [deductionPhotoName, setDeductionPhotoName] = useState<string | null>(
    null,
  );
  const [deductionBusy, setDeductionBusy] = useState(false);
  const [deductionMsg, setDeductionMsg] = useState<string | null>(null);
  const deductionFileRef = useRef<HTMLInputElement>(null);

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

  const activeId = stayId ?? stays[0]?.id ?? null;
  const activeStay = stays.find((s) => s.id === activeId) ?? null;
  const deposit = activeId
    ? data.guestDeposits.find((d) => d.stay_id === activeId) ?? null
    : null;
  const stayCharges = activeId
    ? data.guestCharges.filter((c) => c.stay_id === activeId)
    : [];
  const canAddDeduction =
    !!deposit && deposit.status !== "due" && !!activeStay;

  useEffect(() => {
    if (!activeId || depositDirty) return;
    const row = data.guestDeposits.find((d) => d.stay_id === activeId);
    if (row) {
      setDepositAmount(String(row.amount));
      setDepositCurrency(normalizeBillCurrency(row.currency));
      setDepositNotes(row.notes ?? "");
    } else {
      setDepositAmount("");
      setDepositCurrency("THB");
      setDepositNotes("");
    }
    setDepositMsg(null);
  }, [activeId, data.guestDeposits, depositDirty]);

  useEffect(() => {
    if (!activeId) return;
    setDeductionDesc("");
    setDeductionAmount("");
    setDeductionCurrency(
      deposit ? normalizeBillCurrency(deposit.currency) : "THB",
    );
    setDeductionPhotoUrl(null);
    setDeductionPhotoName(null);
    setDeductionMsg(null);
  }, [activeId, deposit?.currency]);

  if (!data.ready || !data.profile) return <LoadingState />;
  if (!canManage) return <LoadingState />;

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

  const saveDeposit = async () => {
    if (!activeId) return;
    const amount = parseDepositAmount(depositAmount);
    if (amount == null) {
      setDepositMsg(t("guests.depositInvalid"));
      return;
    }
    setDepositBusy(true);
    setDepositMsg(null);
    try {
      await data.upsertGuestDeposit({
        stay_id: activeId,
        amount,
        currency: depositCurrency,
        notes: depositNotes,
      });
      setDepositDirty(false);
      setDepositMsg(t("guests.depositSaved"));
    } catch (e) {
      setDepositMsg(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setDepositBusy(false);
    }
  };

  const attachDeductionPhoto = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setDeductionMsg(t("guest.supportReceiptImageOnly"));
      return;
    }
    setDeductionBusy(true);
    setDeductionMsg(null);
    try {
      const url = await data.uploadVillaPhoto(file);
      if (!url) throw new Error(t("common.error"));
      setDeductionPhotoUrl(url);
      setDeductionPhotoName(file.name);
    } catch (e) {
      setDeductionMsg(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setDeductionBusy(false);
    }
  };

  const saveDeduction = async () => {
    if (!activeId) return;
    const amount = parseDepositAmount(deductionAmount);
    const description = deductionDesc.trim();
    if (!description || amount == null || amount <= 0) {
      setDeductionMsg(t("guests.deductionInvalid"));
      return;
    }
    setDeductionBusy(true);
    setDeductionMsg(null);
    try {
      await data.addGuestCharge({
        stay_id: activeId,
        description,
        amount,
        currency: deductionCurrency,
        proof_photo_url: deductionPhotoUrl,
      });
      setDeductionDesc("");
      setDeductionAmount("");
      setDeductionPhotoUrl(null);
      setDeductionPhotoName(null);
      setDeductionMsg(t("guests.deductionSaved"));
    } catch (e) {
      setDeductionMsg(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setDeductionBusy(false);
    }
  };

  const cancelBooking = async () => {
    if (!activeStay || !activeId) return;
    const guest = data.profiles.find((p) => p.id === activeStay.guest_profile_id);
    const villa =
      data.villas.find((v) => v.id === activeStay.villa_id) ??
      data.allOrgVillas.find((v) => v.id === activeStay.villa_id);
    const ok = window.confirm(
      t("guests.cancelConfirm", {
        guest: guest?.full_name ?? t("guests.guest"),
        villa: villa?.name ?? t("dateRequests.unknownVilla"),
        from: formatShortDate(activeStay.check_in),
        to: formatShortDate(activeStay.check_out),
      }),
    );
    if (!ok) return;
    setCancelBusy(true);
    setCancelMsg(null);
    try {
      await data.cancelGuestStay(activeId);
      setCancelMsg(t("guests.cancelSaved"));
      setDepositDirty(false);
    } catch (e) {
      setCancelMsg(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setCancelBusy(false);
    }
  };

  const parsedDeposit = parseDepositAmount(depositAmount);

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
                    setDepositDirty(false);
                    setOk(null);
                    setError(null);
                    setCancelMsg(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    activeId === s.id
                      ? "bg-primary text-white"
                      : "bg-[#F7F5F1] text-ink",
                  )}
                >
                  {guest?.full_name ?? t("guests.guest")}
                  {villa ? ` · ${villa.name}` : ""}
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
                {t("guests.depositTitle")}
              </p>
              <p className="text-xs text-muted">{t("guests.depositHint")}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {deposit
                  ? t("guests.depositCurrent", {
                      amount: formatDisplay(
                        Number(deposit.amount),
                        deposit.currency,
                      ),
                    })
                  : t("guests.depositNone")}
              </p>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div>
                <Label htmlFor="deposit-amount">
                  {t("guests.depositAmount")}
                </Label>
                <Input
                  id="deposit-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositDirty(true);
                    setDepositAmount(e.target.value);
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="deposit-currency">
                  {t("guests.depositCurrency")}
                </Label>
                <Select
                  id="deposit-currency"
                  value={depositCurrency}
                  onChange={(e) => {
                    setDepositDirty(true);
                    setDepositCurrency(
                      normalizeBillCurrency(e.target.value) as BillCurrency,
                    );
                  }}
                  className="w-28"
                >
                  {BILL_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {billCurrencyLabel(code)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="deposit-notes">{t("guests.depositNotes")}</Label>
              <Input
                id="deposit-notes"
                value={depositNotes}
                onChange={(e) => {
                  setDepositDirty(true);
                  setDepositNotes(e.target.value);
                }}
                placeholder={t("guests.depositNotesPh")}
              />
            </div>
            {depositMsg ? (
              <p
                className={cn(
                  "text-sm font-semibold",
                  depositMsg === t("guests.depositSaved")
                    ? "text-secondary"
                    : "text-danger",
                )}
              >
                {depositMsg}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={
                depositBusy || parsedDeposit == null || !activeId
              }
              onClick={() => void saveDeposit()}
            >
              {depositBusy ? t("common.saving") : t("guests.depositSave")}
            </Button>
          </Card>

          <Card className="space-y-3 p-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                {t("guests.deductionsTitle")}
              </p>
              <p className="text-xs text-muted">{t("guests.deductionsHint")}</p>
            </div>
            {!canAddDeduction ? (
              <p className="text-sm text-muted">
                {t("guests.deductionNeedDeposit")}
              </p>
            ) : (
              <>
                <div>
                  <Label htmlFor="deduction-desc">
                    {t("guests.deductionDescription")}
                  </Label>
                  <Input
                    id="deduction-desc"
                    value={deductionDesc}
                    onChange={(e) => setDeductionDesc(e.target.value)}
                    placeholder={t("guests.deductionDescriptionPh")}
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <Label htmlFor="deduction-amount">
                      {t("guests.deductionAmount")}
                    </Label>
                    <Input
                      id="deduction-amount"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deduction-currency">
                      {t("guests.depositCurrency")}
                    </Label>
                    <Select
                      id="deduction-currency"
                      value={deductionCurrency}
                      onChange={(e) =>
                        setDeductionCurrency(
                          normalizeBillCurrency(e.target.value) as BillCurrency,
                        )
                      }
                      className="w-28"
                    >
                      {BILL_CURRENCIES.map((code) => (
                        <option key={code} value={code}>
                          {billCurrencyLabel(code)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>{t("guests.deductionPhoto")}</Label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full"
                      disabled={deductionBusy}
                      onClick={() => deductionFileRef.current?.click()}
                    >
                      <Paperclip className="size-4" />
                      {t("guests.deductionAttachPhoto")}
                    </Button>
                    {deductionPhotoName ? (
                      <>
                        <span className="text-xs text-muted">
                          {deductionPhotoName}
                        </span>
                        <button
                          type="button"
                          className="text-xs font-bold text-danger"
                          onClick={() => {
                            setDeductionPhotoUrl(null);
                            setDeductionPhotoName(null);
                          }}
                        >
                          {t("guests.deductionRemovePhoto")}
                        </button>
                      </>
                    ) : null}
                    <input
                      ref={deductionFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        void attachDeductionPhoto(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>
                {deductionMsg ? (
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      deductionMsg === t("guests.deductionSaved")
                        ? "text-secondary"
                        : "text-danger",
                    )}
                  >
                    {deductionMsg}
                  </p>
                ) : null}
                <Button
                  type="button"
                  disabled={
                    deductionBusy ||
                    !deductionDesc.trim() ||
                    parseDepositAmount(deductionAmount) == null ||
                    (parseDepositAmount(deductionAmount) ?? 0) <= 0
                  }
                  onClick={() => void saveDeduction()}
                >
                  {deductionBusy ? t("common.saving") : t("guests.deductionSave")}
                </Button>
              </>
            )}
            {stayCharges.length ? (
              <div className="space-y-2 border-t border-black/5 pt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {t("guests.deductionsList")}
                </p>
                <ul className="space-y-2">
                  {stayCharges.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-2 rounded-xl bg-[#F7F5F1] p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-ink">
                          <LocalizedText text={c.description} />
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-ink">
                        {formatDisplay(Number(c.amount), c.currency)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : canAddDeduction ? (
              <p className="text-sm text-muted">{t("guests.noDeductions")}</p>
            ) : null}
          </Card>

          {activeStay ? (
            <Card className="space-y-3 border border-danger/20 p-4">
              <div>
                <p className="font-display text-lg font-bold text-ink">
                  {t("guests.cancelTitle")}
                </p>
                <p className="text-xs text-muted">{t("guests.cancelHint")}</p>
                {isUnpaidBeforeArrivalDeposit(deposit) ? (
                  <p className="text-xs font-medium text-amber-800">
                    {t("guests.cancelUnpaidDepositHint")}
                  </p>
                ) : null}
              </div>
              {cancelMsg ? (
                <p
                  className={cn(
                    "text-sm font-semibold",
                    cancelMsg === t("guests.cancelSaved")
                      ? "text-secondary"
                      : "text-danger",
                  )}
                >
                  {cancelMsg}
                </p>
              ) : null}
              <Button
                type="button"
                variant="danger"
                disabled={cancelBusy}
                onClick={() => void cancelBooking()}
              >
                {cancelBusy ? t("common.saving") : t("guests.cancelButton")}
              </Button>
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
                      <p className="font-semibold text-ink">
                        <LocalizedText text={b.title} />
                      </p>
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
                  <LocalizedText
                    text={b.body}
                    as="p"
                    className="whitespace-pre-wrap text-sm text-ink"
                    multiline
                  />
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
