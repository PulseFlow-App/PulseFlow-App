import type {
  BillWithRelations,
  ServiceOrder,
  TaskWithRelations,
  Villa,
  VillaMaintenanceLog,
} from "@/lib/types";
import { formatOrderWhen } from "@/lib/service-orders";
import { formatAmountInDisplayCurrency } from "@/lib/billing/use-display-currency";
import type { BillCurrency } from "@/lib/billing/currencies";
import { normalizeBillCurrency } from "@/lib/billing/currencies";
import { convertBillAmount } from "@/lib/billing/convert-currency";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { rowsToCsv } from "@/lib/export/csv";

export function billsToCsv(bills: BillWithRelations[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Date",
      "Description",
      "Category",
      "Property",
      "Amount",
      "Currency",
      "Status",
      "Submitted by",
      "Due date",
      "Receipt URL",
    ],
    ...bills.map((b) => [
      b.created_at.slice(0, 10),
      b.description,
      b.category ?? "other",
      b.villa?.name ?? "General",
      Number(b.amount),
      b.currency,
      b.status,
      b.submitter?.full_name ?? "",
      b.due_date ?? "",
      b.receipt_photo_url ?? "",
    ]),
  ];
  return rowsToCsv(rows);
}

/** Budget-friendly shape for Google Sheets / Excel paste. */
export function budgetSheetToCsv(bills: BillWithRelations[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Month",
      "Property",
      "Category",
      "Amount",
      "Currency",
      "Paid?",
      "Description",
      "Date",
      "Receipt URL",
    ],
    ...bills.map((b) => {
      const date = b.created_at.slice(0, 10);
      return [
        date.slice(0, 7),
        b.villa?.name ?? "General",
        b.category ?? "other",
        Number(b.amount),
        b.currency ?? "THB",
        b.status === "paid" ? "yes" : "no",
        b.description,
        date,
        b.receipt_photo_url ?? "",
      ];
    }),
  ];
  return rowsToCsv(rows);
}

/** Occupancy / stay dates for calendar or sheet planning. */
export function occupancyToCsv(villas: Villa[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Property",
      "Area",
      "Status",
      "Check-in",
      "Check-out",
      "Cleaning",
      "Notes",
    ],
    ...villas.map((v) => [
      v.name,
      v.area ?? "",
      v.status,
      v.check_in ?? "",
      v.check_out ?? "",
      v.cleaning_status,
      v.notes ?? "",
    ]),
  ];
  return rowsToCsv(rows);
}

export function tasksToCsv(tasks: TaskWithRelations[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Title",
      "Property",
      "Priority",
      "Status",
      "Assignee",
      "Due date",
      "Time window",
      "Created",
    ],
    ...tasks.map((t) => [
      t.title,
      t.villa?.name ?? "General",
      t.priority,
      t.status,
      t.assignee?.full_name ?? "",
      t.due_date ?? "",
      [t.time_start, t.time_end].filter(Boolean).join("-") || "",
      t.created_at.slice(0, 10),
    ]),
  ];
  return rowsToCsv(rows);
}

export function villasToCsv(villas: Villa[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Property",
      "Area",
      "Size m2",
      "Bedrooms",
      "Bathrooms",
      "Max guests",
      "Floors",
      "Pool",
      "Garden",
      "Setting",
      "Parking",
      "Kitchen",
      "Air-con",
      "View",
      "Wi-Fi",
      "Pets",
      "Status",
      "Check-in",
      "Check-out",
      "Cleaning",
      "Updated",
    ],
    ...villas.map((v) => [
      v.name,
      v.area ?? "",
      v.sq_m ?? "",
      v.bedrooms ?? "",
      v.bathrooms ?? "",
      v.max_guests ?? "",
      v.floors ?? "",
      v.has_pool == null ? "" : v.has_pool ? "yes" : "no",
      v.has_garden == null ? "" : v.has_garden ? "yes" : "no",
      v.setting ?? "",
      v.parking ?? "",
      v.kitchen ?? "",
      v.aircon ?? "",
      v.view ?? "",
      v.has_wifi == null ? "" : v.has_wifi ? "yes" : "no",
      v.pet_friendly == null ? "" : v.pet_friendly ? "yes" : "no",
      v.status,
      v.check_in ?? "",
      v.check_out ?? "",
      v.cleaning_status,
      v.updated_at?.slice(0, 10) ?? "",
    ]),
  ];
  return rowsToCsv(rows);
}

export function serviceOrdersToCsv(orders: ServiceOrder[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Service",
      "Location",
      "When",
      "Status",
      "Scheduled",
    ],
    ...orders.map((o) => [
      o.service_type,
      o.location_label ?? "",
      formatOrderWhen(o),
      o.status,
      o.scheduled_date ?? "",
    ]),
  ];
  return rowsToCsv(rows);
}

export type WeeklySummaryData = {
  orgName: string;
  weekLabel: string;
  generatedAt: string;
  villas: Villa[];
  urgentTasks: TaskWithRelations[];
  pendingBills: BillWithRelations[];
  upcomingOrders: ServiceOrder[];
  displayCurrency?: BillCurrency;
};

export function buildWeeklySummaryHtml(data: WeeklySummaryData): string {
  const urgentLines =
    data.urgentTasks.length === 0
      ? "<li>None</li>"
      : data.urgentTasks
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.title)}</strong> - ${escapeHtml(t.villa?.name ?? "General")}${t.due_date ? ` · due ${formatShortDate(t.due_date)}` : ""}</li>`,
          )
          .join("");

  const displayCurrency = data.displayCurrency;
  const billLines =
    data.pendingBills.length === 0
      ? "<li>None</li>"
      : data.pendingBills
          .map((b) => {
            const money = displayCurrency
              ? formatAmountInDisplayCurrency(
                  Number(b.amount),
                  b.currency,
                  displayCurrency,
                )
              : formatMoney(Number(b.amount), normalizeBillCurrency(b.currency));
            return `<li>${escapeHtml(b.description)} - ${money} · ${escapeHtml(b.villa?.name ?? "General")}</li>`;
          })
          .join("");

  const turnoverLines = data.villas
    .filter((v) => v.status === "turnover" || v.check_in || v.check_out)
    .map(
      (v) =>
        `<li><strong>${escapeHtml(v.name)}</strong> - ${v.status}${v.check_in ? ` · in ${formatShortDate(v.check_in)}` : ""}${v.check_out ? ` · out ${formatShortDate(v.check_out)}` : ""}</li>`,
    )
    .join("") || "<li>None flagged</li>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Operations summary · ${escapeHtml(data.orgName)}</title>
  <style>
    body { font-family: Heebo, system-ui, sans-serif; max-width: 720px; margin: 24px auto; color: #023047; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 4px; }
    .meta { color: #5a6d78; font-size: 0.9rem; margin-bottom: 20px; }
    h2 { font-size: 1rem; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    ul { margin: 0; padding-left: 1.2rem; }
    li { margin: 4px 0; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Operations summary</h1>
  <p class="meta">${escapeHtml(data.orgName)} · ${escapeHtml(data.weekLabel)} · Generated ${escapeHtml(data.generatedAt)}</p>
  <h2>Turnovers &amp; schedule</h2>
  <ul>${turnoverLines}</ul>
  <h2>Urgent tasks</h2>
  <ul>${urgentLines}</ul>
  <h2>Pending bills</h2>
  <ul>${billLines}</ul>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export type MaintenanceLogReportData = {
  orgName: string;
  periodLabel: string;
  generatedAt: string;
  villas: Villa[];
  logs: VillaMaintenanceLog[];
};

export function buildMaintenanceLogHtml(
  data: MaintenanceLogReportData,
): string {
  const villaName = (id: string) =>
    data.villas.find((v) => v.id === id)?.name ?? "Property";

  const sorted = [...data.logs].sort((a, b) =>
    b.logged_on.localeCompare(a.logged_on),
  );

  const lines =
    sorted.length === 0
      ? "<li>None</li>"
      : sorted
          .map((log) => {
            const parts = [
              escapeHtml(log.logged_on),
              `<strong>${escapeHtml(villaName(log.villa_id))}</strong>`,
              escapeHtml(log.item),
            ];
            if (log.vendor?.trim()) {
              parts.push(escapeHtml(log.vendor.trim()));
            }
            if (log.description?.trim()) {
              parts.push(escapeHtml(log.description.trim()));
            }
            if (log.photo_url) {
              parts.push(
                `<a href="${escapeHtml(log.photo_url)}">photo</a>`,
              );
            }
            return `<li>${parts.join(" · ")}</li>`;
          })
          .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Maintenance log · ${escapeHtml(data.orgName)}</title>
  <style>
    body { font-family: Heebo, system-ui, sans-serif; max-width: 720px; margin: 24px auto; color: #023047; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 4px; }
    .meta { color: #5a6d78; font-size: 0.9rem; margin-bottom: 20px; }
    h2 { font-size: 1rem; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    ul { margin: 0; padding-left: 1.2rem; }
    li { margin: 6px 0; }
    a { color: #219ebc; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Maintenance log</h1>
  <p class="meta">${escapeHtml(data.orgName)} · ${escapeHtml(data.periodLabel)} · Generated ${escapeHtml(data.generatedAt)}</p>
  <h2>Entries</h2>
  <ul>${lines}</ul>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type MonthlyMoneySummaryData = {

  orgName: string;
  monthLabel: string;
  generatedAt: string;
  displayCurrency: BillCurrency;
  bills: BillWithRelations[];
};

export function buildMonthlyMoneySummaryHtml(
  data: MonthlyMoneySummaryData,
): string {
  const money = (amount: number, currency: string) =>
    formatAmountInDisplayCurrency(
      amount,
      currency,
      data.displayCurrency,
    );

  let spend = 0;
  let pending = 0;
  let paid = 0;
  const byVilla = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const lines: string[] = [];

  for (const b of data.bills) {
    const from = normalizeBillCurrency(b.currency);
    const amount = convertBillAmount(
      Number(b.amount),
      from,
      data.displayCurrency,
    );
    spend += amount;
    if (b.status === "pending") pending += amount;
    else paid += amount;
    const villa = b.villa?.name ?? "General";
    byVilla.set(villa, (byVilla.get(villa) ?? 0) + amount);
    const cat = b.category ?? "other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + amount);
    lines.push(
      `<li>${escapeHtml(b.created_at.slice(0, 10))} · ${escapeHtml(b.description)} · ${money(Number(b.amount), b.currency)} · ${escapeHtml(villa)} · ${escapeHtml(b.status)}${b.receipt_photo_url ? ` · <a href="${escapeHtml(b.receipt_photo_url)}">receipt</a>` : ""}</li>`,
    );
  }

  const villaLines =
    [...byVilla.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([name, total]) =>
          `<li><strong>${escapeHtml(name)}</strong> · ${formatMoney(total, data.displayCurrency)}</li>`,
      )
      .join("") || "<li>None</li>";

  const catLines =
    [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([name, total]) =>
          `<li><strong>${escapeHtml(name)}</strong> · ${formatMoney(total, data.displayCurrency)}</li>`,
      )
      .join("") || "<li>None</li>";

  const billLines = lines.length ? lines.join("") : "<li>None</li>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Finances report · ${escapeHtml(data.orgName)}</title>
  <style>
    body { font-family: Heebo, system-ui, sans-serif; max-width: 720px; margin: 24px auto; color: #023047; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 4px; }
    .meta { color: #5a6d78; font-size: 0.9rem; margin-bottom: 20px; }
    .totals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 16px 0 8px; }
    .totals div { background: #f5fafc; border-radius: 12px; padding: 12px; }
    .totals strong { display: block; font-size: 1.1rem; margin-top: 4px; }
    h2 { font-size: 1rem; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    ul { margin: 0; padding-left: 1.2rem; }
    li { margin: 4px 0; }
    a { color: #219ebc; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Finances report</h1>
  <p class="meta">${escapeHtml(data.orgName)} · ${escapeHtml(data.monthLabel)} · Generated ${escapeHtml(data.generatedAt)}</p>
  <div class="totals">
    <div>Spend<strong>${formatMoney(spend, data.displayCurrency)}</strong></div>
    <div>Pending<strong>${formatMoney(pending, data.displayCurrency)}</strong></div>
    <div>Paid<strong>${formatMoney(paid, data.displayCurrency)}</strong></div>
  </div>
  <h2>By property</h2>
  <ul>${villaLines}</ul>
  <h2>By category</h2>
  <ul>${catLines}</ul>
  <h2>Bills</h2>
  <ul>${billLines}</ul>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export type HandoffPayload = {
  captured_at: string;
  org_name: string;
  properties: {
    name: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    cleaning_status: string;
    open_tasks: number;
    pending_bills: number;
  }[];
};

export function buildHandoffPayload(input: {
  orgName: string;
  villas: Villa[];
  tasks: TaskWithRelations[];
  bills: BillWithRelations[];
}): HandoffPayload {
  return {
    captured_at: new Date().toISOString(),
    org_name: input.orgName,
    properties: input.villas.map((v) => ({
      name: v.name,
      status: v.status,
      check_in: v.check_in,
      check_out: v.check_out,
      cleaning_status: v.cleaning_status,
      open_tasks: input.tasks.filter(
        (t) => t.villa_id === v.id && t.status === "open",
      ).length,
      pending_bills: input.bills.filter(
        (b) => b.villa_id === v.id && b.status === "pending",
      ).length,
    })),
  };
}

export function handoffToCsv(payload: HandoffPayload): string {
  const rows: (string | number | null)[][] = [
    [
      "Property",
      "Status",
      "Check-in",
      "Check-out",
      "Cleaning",
      "Open tasks",
      "Pending bills",
    ],
    ...payload.properties.map((p) => [
      p.name,
      p.status,
      p.check_in,
      p.check_out,
      p.cleaning_status,
      p.open_tasks,
      p.pending_bills,
    ]),
  ];
  return rowsToCsv(rows);
}
