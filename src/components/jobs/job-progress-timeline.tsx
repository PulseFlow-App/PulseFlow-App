"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils";
import { normalizeBillCurrency } from "@/lib/billing/currencies";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import {
  buildJobProgress,
  type JobProgressModel,
} from "@/lib/jobs/progress";
import type { Bill, Profile, ServiceOrder } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

function stepMeta(
  step: JobProgressModel["steps"][number],
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  if (step.detailKey) {
    return [step.actorName, t(step.detailKey)].filter(Boolean).join(" · ") || null;
  }
  return [step.actorName, step.clock].filter(Boolean).join(" · ") || null;
}

export function JobProgressTimeline({
  order,
  profiles,
  bills,
  defaultOpen,
}: {
  order: ServiceOrder;
  profiles: Profile[];
  bills: Bill[];
  /** Open by default for active jobs. */
  defaultOpen?: boolean;
}) {
  const { t } = useI18n();
  const model = buildJobProgress(order, profiles, bills);
  const preferOpen =
    defaultOpen ??
    (order.status === "pending_ack" || order.status === "agreed");
  const [open, setOpen] = useState(preferOpen);

  const statusKey = `order.status.${model.status}` as MessageKey;
  const metaParts = [
    model.whenLabel || null,
    model.assigneeName
      ? t("jobs.progress.metaAssigned", { name: model.assigneeName })
      : null,
  ].filter(Boolean);

  const bill = model.pendingBill;
  const billLabel = bill
    ? t("jobs.progress.billPending", {
        amount: formatMoney(
          Number(bill.amount),
          normalizeBillCurrency(bill.currency),
        ),
      })
    : null;

  return (
    <div className="bg-card">
      <div className="bg-ink px-4 py-3 text-white">
        <p className="font-display text-sm font-bold leading-snug">
          {t("jobs.progress.title", { villa: model.villaLabel })}
        </p>
        <p className="mt-0.5 text-xs text-white/80">
          <LocalizedText text={model.serviceType} />
        </p>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              model.status === "done" && "bg-sky-soft/50 text-sky",
              model.status === "agreed" && "bg-secondary/15 text-secondary-dark",
              model.status === "pending_ack" && "bg-sun/20 text-ink",
              model.status === "cancelled" && "bg-danger/10 text-danger",
            )}
          >
            {t(statusKey)}
          </span>
          {metaParts.length > 0 ? (
            <p className="text-xs text-muted">{metaParts.join(" · ")}</p>
          ) : null}
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-sky"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("jobs.progress.hide") : t("jobs.progress.show")}
        </button>

        {open ? (
          <ol className="relative space-y-0 ps-0">
            {model.steps.map((step, index) => {
              const meta = stepMeta(step, t);
              const isLast = index === model.steps.length - 1;
              return (
                <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {!isLast ? (
                    <span
                      className={cn(
                        "absolute start-[0.7rem] top-6 bottom-0 w-px",
                        step.done ? "bg-sky" : "bg-[var(--color-border)]",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                      step.done
                        ? "bg-sky text-white"
                        : "border border-[var(--color-border)] bg-canvas-deep text-muted",
                    )}
                    aria-hidden
                  >
                    {step.done ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        step.done ? "text-ink" : "text-muted",
                      )}
                    >
                      {t(step.titleKey)}
                    </p>
                    {meta ? (
                      <p className="text-xs text-muted">{meta}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        {bill && billLabel ? (
          <Link
            href="/bills"
            className="block rounded-2xl bg-sun/25 px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-sun/35"
          >
            {billLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
