import type {
  BillWithRelations,
  ServiceOrder,
  TaskWithRelations,
  Villa,
} from "@/lib/types";
import { formatOrderWhen } from "@/lib/service-orders";
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
      "Status",
      "Check-in",
      "Check-out",
      "Cleaning",
      "Updated",
    ],
    ...villas.map((v) => [
      v.name,
      v.area ?? "",
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
      o.scheduled_date,
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

  const billLines =
    data.pendingBills.length === 0
      ? "<li>None</li>"
      : data.pendingBills
          .map(
            (b) =>
              `<li>${escapeHtml(b.description)} - ${formatMoney(Number(b.amount))} · ${escapeHtml(b.villa?.name ?? "General")}</li>`,
          )
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
  <title>Weekly ops · ${escapeHtml(data.orgName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 24px auto; color: #16231f; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 4px; }
    .meta { color: #4a544f; font-size: 0.9rem; margin-bottom: 20px; }
    h2 { font-size: 1rem; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    ul { margin: 0; padding-left: 1.2rem; }
    li { margin: 4px 0; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Weekly ops summary</h1>
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
