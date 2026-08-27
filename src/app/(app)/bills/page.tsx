"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { BILL_CATEGORIES, type BillCategory } from "@/lib/design-tokens";
import { canMarkBillsPaid, canViewBillFinance } from "@/lib/roles";
import {
  canUseManagerReporting,
  historyCutoffIso,
} from "@/lib/billing/reporting";
import { cn, formatMoney, formatMoneyCompact, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import type { MessageKey } from "@/lib/i18n";

type PeriodKey = "all" | "this_month" | "last_30" | "last_90" | "custom";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function inPeriod(
  iso: string,
  period: PeriodKey,
  customFrom: string,
  customTo: string,
) {
  const created = new Date(iso);
  if (period === "all") return true;
  if (period === "this_month") return created >= startOfMonth();
  if (period === "last_30") return created >= daysAgo(30);
  if (period === "last_90") return created >= daysAgo(90);
  if (period === "custom") {
    if (customFrom) {
      const from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      if (created < from) return false;
    }
    if (customTo) {
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      if (created > to) return false;
    }
    return true;
  }
  return true;
}

export default function BillsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const canPay = data.profile
    ? canMarkBillsPaid(data.profile.role)
    : false;
  const showFinance = data.profile
    ? canViewBillFinance(data.profile.role, data.orgKind)
    : false;

  const extendedHistory = useMemo(
    () =>
      data.profile
        ? canUseManagerReporting({
            role: data.profile.role,
            orgKind: data.orgKind,
            organization: data.organization,
          })
        : false,
    [data.profile, data.orgKind, data.organization],
  );
  const historyCutoff = useMemo(() => {
    if (data.profile?.role !== "manager") return null;
    return historyCutoffIso(extendedHistory);
  }, [data.profile?.role, extendedHistory]);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [villaId, setVillaId] = useState("");
  const [category, setCategory] = useState<BillCategory>("other");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [filterVilla, setFilterVilla] = useState("");
  const [filterCategory, setFilterCategory] = useState<"" | BillCategory>("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return data.bills.filter((b) => {
      if (
        historyCutoff &&
        new Date(b.created_at) < new Date(historyCutoff)
      ) {
        return false;
      }
      if (filterVilla && b.villa_id !== filterVilla) return false;
      if (filterCategory && (b.category ?? "other") !== filterCategory) {
        return false;
      }
      if (!showFinance) return true;
      return inPeriod(b.created_at, period, customFrom, customTo);
    });
  }, [
    data.bills,
    filterVilla,
    filterCategory,
    showFinance,
    period,
    customFrom,
    customTo,
    historyCutoff,
  ]);

  const pendingTotal = useMemo(
    () =>
      filtered
        .filter((b) => b.status === "pending")
        .reduce((sum, b) => sum + Number(b.amount), 0),
    [filtered],
  );

  const paidTotal = useMemo(
    () =>
      filtered
        .filter((b) => b.status === "paid")
        .reduce((sum, b) => sum + Number(b.amount), 0),
    [filtered],
  );

  const spendTotal = useMemo(
    () => filtered.reduce((sum, b) => sum + Number(b.amount), 0),
    [filtered],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      const key = b.category ?? "other";
      map.set(key, (map.get(key) ?? 0) + Number(b.amount));
    }
    return [...map.entries()]
      .map(([cat, total]) => ({ cat: cat as BillCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const byVilla = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      const key = b.villa_id ?? "__general__";
      map.set(key, (map.get(key) ?? 0) + Number(b.amount));
    }
    return [...map.entries()]
      .map(([id, total]) => ({
        id,
        name:
          id === "__general__"
            ? t("common.general")
            : (data.villas.find((v) => v.id === id)?.name ?? t("common.general")),
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, data.villas, t]);

  if (!data.ready) return <LoadingState />;

  const submit = async () => {
    setError(null);
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setError(t("bills.errorRequired"));
      return;
    }
    setSaving(true);
    try {
      let receipt: string | null = null;
      if (file) receipt = await data.uploadReceipt(file);
      await data.createBill({
        description: description.trim(),
        amount: value,
        villa_id: villaId || null,
        category,
        due_date: dueDate || null,
        receipt_photo_url: receipt,
      });
      setDescription("");
      setAmount("");
      setVillaId("");
      setCategory("other");
      setDueDate("");
      setFile(null);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bills.errorSubmit"));
    } finally {
      setSaving(false);
    }
  };

  const categoryLabel = (cat: BillCategory) =>
    t(`bills.category.${cat}` as MessageKey);

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-ink">
            {showFinance ? t("bills.financeTitle") : t("bills.title")}
          </h1>
          <p className="text-sm text-muted">
            {showFinance ? t("bills.financeSubtitle") : t("bills.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setShowForm((open) => {
              const next = !open;
              if (next) {
                requestAnimationFrame(() => {
                  formRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
              }
              return next;
            });
          }}
        >
          {showForm ? (
            t("common.cancel")
          ) : (
            <>
              <Plus className="size-4" /> {t("common.add")}
            </>
          )}
        </Button>
      </div>

      {showForm ? (
        <div ref={formRef}>
          <Card className="space-y-3 p-4">
          <div>
            <Label>{t("bills.description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("bills.amount")}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("bills.villa")}</Label>
              <Select
                value={villaId}
                onChange={(e) => setVillaId(e.target.value)}
              >
                <option value="">{t("common.general")}</option>
                {data.villas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("bills.category")}</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {BILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    category === cat
                      ? "bg-primary text-white"
                      : "bg-[#F7F5F1] text-ink",
                  )}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("bills.dueDate")}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("bills.receipt")}</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            className="w-full"
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving ? t("bills.submitting") : t("bills.submit")}
          </Button>
          </Card>
        </div>
      ) : null}

      {showFinance ? (
        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold text-ink">{t("bills.filters")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("bills.period")}</Label>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              >
                <option value="this_month">{t("bills.period.thisMonth")}</option>
                <option value="last_30">{t("bills.period.last30")}</option>
                <option value="last_90">{t("bills.period.last90")}</option>
                <option value="custom">{t("bills.period.custom")}</option>
                <option value="all">{t("bills.period.all")}</option>
              </Select>
            </div>
            <div>
              <Label>{t("bills.villa")}</Label>
              <Select
                value={filterVilla}
                onChange={(e) => setFilterVilla(e.target.value)}
              >
                <option value="">{t("bills.allVillas")}</option>
                {data.villas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("bills.from")}</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>{t("bills.to")}</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div>
            <Label>{t("bills.category")}</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterCategory("")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  filterCategory === ""
                    ? "bg-primary text-white"
                    : "bg-[#F7F5F1] text-ink",
                )}
              >
                {t("bills.allCategories")}
              </button>
              {BILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setFilterCategory((prev) => (prev === cat ? "" : cat))
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    filterCategory === cat
                      ? "bg-primary text-white"
                      : "bg-[#F7F5F1] text-ink",
                  )}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {showFinance ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="min-w-0 bg-gradient-to-br from-primary to-primary-dark p-3 text-white sm:p-4">
            <p className="text-[10px] leading-tight text-white/80 sm:text-sm">
              {t("bills.totalSpend")}
            </p>
            <p className="mt-1 font-display text-sm font-bold tabular-nums leading-none sm:mt-1.5 sm:text-2xl">
              {formatMoneyCompact(spendTotal)}
            </p>
          </Card>
          <Card className="min-w-0 p-3 sm:p-4">
            <p className="text-[10px] leading-tight text-muted sm:text-sm">
              {t("bills.paidTotal")}
            </p>
            <p className="mt-1 font-display text-sm font-bold tabular-nums leading-none text-secondary sm:mt-1.5 sm:text-2xl">
              {formatMoneyCompact(paidTotal)}
            </p>
          </Card>
          <Card className="min-w-0 p-3 sm:p-4">
            <p className="text-[10px] leading-tight text-muted sm:text-sm">
              {t("bills.pendingTotal")}
            </p>
            <p className="mt-1 font-display text-sm font-bold tabular-nums leading-none text-warning-dark sm:mt-1.5 sm:text-2xl">
              {formatMoneyCompact(pendingTotal)}
            </p>
          </Card>
        </div>
      ) : null}

      {showFinance && (byCategory.length > 0 || byVilla.length > 0) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold text-ink">
              {t("bills.byCategory")}
            </p>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted">{t("bills.noSpend")}</p>
            ) : (
              byCategory.map((row) => (
                <div
                  key={row.cat}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="rounded-full bg-[#F7F5F1] px-2.5 py-0.5 text-xs font-semibold text-ink">
                    {categoryLabel(row.cat)}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatMoney(row.total)}
                  </span>
                </div>
              ))
            )}
          </Card>
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold text-ink">{t("bills.byVilla")}</p>
            {byVilla.length === 0 ? (
              <p className="text-sm text-muted">{t("bills.noSpend")}</p>
            ) : (
              byVilla.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-ink">{row.name}</span>
                  <span className="font-semibold text-ink">
                    {formatMoney(row.total)}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title={t("bills.empty")}
          description={t("bills.emptyHint")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((bill) => (
            <li key={bill.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{label(bill.description)}</p>
                    <p className="mt-1">
                      <span className="rounded-full bg-[#F7F5F1] px-2 py-0.5 text-[11px] font-semibold text-ink">
                        {categoryLabel(bill.category ?? "other")}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {bill.villa?.name ?? t("common.general")} ·{" "}
                      {bill.submitter?.full_name ?? t("bills.someone")} ·{" "}
                      {formatShortDate(bill.created_at.slice(0, 10))}
                      {bill.due_date
                        ? ` · ${t("bills.due", { date: formatShortDate(bill.due_date) })}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-ink">
                      {formatMoney(Number(bill.amount), bill.currency)}
                    </p>
                    <span
                      className={
                        bill.status === "paid"
                          ? "text-xs font-semibold text-secondary"
                          : "text-xs font-semibold text-warning-dark"
                      }
                    >
                      {t(`status.bill.${bill.status}` as MessageKey)}
                    </span>
                  </div>
                </div>
                {bill.receipt_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bill.receipt_photo_url}
                    alt={t("bills.receipt")}
                    className="mt-3 max-h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                {canPay && bill.status === "pending" ? (
                  <Button
                    className="mt-3 w-full"
                    variant="secondary"
                    size="sm"
                    onClick={() => void data.setBillStatus(bill.id, "paid")}
                  >
                    {t("bills.markPaid")}
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
