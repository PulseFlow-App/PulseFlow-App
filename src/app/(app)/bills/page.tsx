"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function BillsPage() {
  const data = useData();
  const { t } = useI18n();
  const isOwner =
    data.profile?.role === "owner" || data.profile?.role === "manager";
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [villaId, setVillaId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pendingTotal = useMemo(
    () =>
      data.bills
        .filter((b) => b.status === "pending")
        .reduce((sum, b) => sum + Number(b.amount), 0),
    [data.bills],
  );

  if (!data.ready) return <LoadingState />;

  const submit = async () => {
    setError(null);
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a description and valid amount.");
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
        due_date: dueDate || null,
        receipt_photo_url: receipt,
      });
      setDescription("");
      setAmount("");
      setVillaId("");
      setDueDate("");
      setFile(null);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit bill.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("bills.title")}
          </h1>
          <p className="text-sm text-muted">{t("bills.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> {t("common.add")}
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary-dark p-4 text-white">
        <p className="text-sm text-white/80">{t("bills.pendingTotal")}</p>
        <p className="font-display text-3xl font-bold">
          {formatMoney(pendingTotal)}
        </p>
      </Card>

      {showForm ? (
        <Card className="space-y-3 p-4">
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (THB)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Villa</Label>
              <Select
                value={villaId}
                onChange={(e) => setVillaId(e.target.value)}
              >
                <option value="">General</option>
                {data.villas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Due date (optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Receipt photo</Label>
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
            {saving ? "Submitting…" : "Submit bill"}
          </Button>
        </Card>
      ) : null}

      {data.bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Submit a receipt when you spend on villa ops."
        />
      ) : (
        <ul className="space-y-3">
          {data.bills.map((bill) => (
            <li key={bill.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{bill.description}</p>
                    <p className="text-xs text-muted">
                      {bill.villa?.name ?? "General"} ·{" "}
                      {bill.submitter?.full_name ?? "Someone"} ·{" "}
                      {formatShortDate(bill.created_at.slice(0, 10))}
                      {bill.due_date
                        ? ` · due ${formatShortDate(bill.due_date)}`
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
                      {bill.status}
                    </span>
                  </div>
                </div>
                {bill.receipt_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bill.receipt_photo_url}
                    alt="Receipt"
                    className="mt-3 max-h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                {isOwner && bill.status === "pending" ? (
                  <Button
                    className="mt-3 w-full"
                    variant="secondary"
                    size="sm"
                    onClick={() => void data.setBillStatus(bill.id, "paid")}
                  >
                    Mark paid
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
