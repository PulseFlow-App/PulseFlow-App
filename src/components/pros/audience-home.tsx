"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrderCard, type CustomerOrder } from "@/components/pros/order-card";
import { compareDeliveries, isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { appOriginForHost, servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";

type Listing = {
  job_search_visible: boolean;
};

type CompanyTask = {
  id: string;
  title: string;
  due: string | null;
  priority: string;
  property: string;
};

function dayLabel(iso: string, locale: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

function hasServicesAccount(actor: { id: string; role: string } | null) {
  return Boolean(actor && actor.role !== "guest" && !actor.id.startsWith("local"));
}

/** Public home. One side looks for staff. The other side becomes staff. */
export function ServicesWelcome() {
  const { actor, t } = usePros();
  const pathname = usePathname();
  const [busy, setBusy] = useState<"hire" | "work" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const account = hasServicesAccount(actor);

  const registerHref = servicesPath(pathname, "/register?track=maintenance");
  const exploreHref = servicesPath(pathname, "/explore");

  async function choose(intent: "hire" | "work") {
    setError(null);
    setBusy(intent);
    try {
      const res = await fetch("/api/services/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      if (!res.ok) throw new Error();
      window.location.assign(servicesPath(pathname, "/"));
    } catch {
      setError(t("welcomeSaveFail"));
      setBusy(null);
    }
  }

  const findClass = "mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white";
  const becomeClass = "mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#F5F7FC] px-4 text-pf-16 font-medium text-pf-navy-900";

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-extrabold tracking-[-0.03em] text-pf-ink">{t("welcomeTitle")}</h1>

      <section className="rounded-[28px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("findStaffTitle")}</h2>
        <p className="mt-1 max-w-[70ch] text-pf-14 leading-snug text-pf-text-secondary">{t("findStaffBody")}</p>
        <Link href={exploreHref} className={findClass}>
          {t("findStaffCta")}
        </Link>
      </section>

      <section className="rounded-[28px] bg-pf-navy-900 p-4 text-pf-on-panel">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em]">{t("becomeStaffTitle")}</h2>
        <p className="mt-1 max-w-[70ch] text-pf-14 leading-snug text-pf-on-panel/80">{t("becomeStaffBody")}</p>
        {account ? (
          <button type="button" className={becomeClass} disabled={busy != null} onClick={() => void choose("work")}>
            {t("becomeStaffCta")}
          </button>
        ) : (
          <Link href={registerHref} className={becomeClass}>
            {t("becomeStaffCta")}
          </Link>
        )}
      </section>

      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
    </div>
  );
}

function deliveryCard(row: ServiceDelivery, to: (path: string) => string): CustomerOrder {
  const cancelled = Boolean(row.cancelled_at);
  const accepted = !cancelled && isAgreedReply(row.reply_message);
  const price = quoteLabel(row);
  return {
    id: row.id,
    localRequestId: row.request_id,
    state: cancelled ? "cancelled" : accepted ? "booked" : price ? "price" : "waiting",
    createdAt: row.created_at,
    title: row.title,
    description: row.description,
    whenLabel: row.when_label,
    area: row.area_label ?? null,
    shareLocation: accepted ? row.share_location ?? null : null,
    photos: (row.photos ?? []).filter((src): src is string => typeof src === "string" && src.length > 0),
    personName: "",
    priceLabel: price,
    quoteNote: row.quote_note ?? null,
    cancelReason: row.cancel_reason ?? null,
    repliedAt: row.replied_at,
    acceptedAt: row.accepted_at ?? null,
    chatHref: to(`/chat/${row.id}`),
    reviewHref: to("/inbox"),
  };
}

/** Home for maintenance accounts. A work dashboard, with no search. */
export function WorkHome() {
  const { actor, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceDelivery[] | null>(null);
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!actor || actor.id.startsWith("local")) {
      setRequests([]);
      return;
    }
    let cancelled = false;
    void fetch("/api/services/requests", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((payload: { requests?: ServiceDelivery[] }) => {
        if (cancelled) return;
        const mine = (payload.requests ?? []).filter((row) => row.target_profile_id === actor.id);
        setRequests(mine);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      });
    void fetch("/api/services/company-tasks", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { tasks: [] }))
      .then((payload: { tasks?: CompanyTask[] }) => {
        if (!cancelled) setTasks(payload.tasks ?? []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { eligible?: boolean; profile?: Listing | null } | null) => {
        if (cancelled || !payload?.eligible || !payload.profile) return;
        setNeedsProfile(!payload.profile.job_search_visible);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const open = (requests ?? [])
    .filter((row) => !row.cancelled_at && !isAgreedReply(row.reply_message))
    .sort(compareDeliveries);
  const confirmed = (requests ?? [])
    .filter((row) => !row.cancelled_at && isAgreedReply(row.reply_message))
    .sort(compareDeliveries);
  const to = (path: string) => servicesPath(pathname, path);
  const preview = confirmed[0] ?? open[0] ?? null;
  const openTask = (id: string) => {
    const origin = appOriginForHost(window.location.host, window.location.protocol);
    window.location.assign(`${origin}/tasks?focus=${id}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("workHomeTitle")}</h1>
      {requests == null ? null : (
        <section className="rounded-[28px] bg-pf-navy-900 p-5 text-pf-on-panel">
          <div className="grid grid-cols-2 gap-3">
            <a href="#work-confirmed" className="block min-h-11">
              <p className="text-pf-48 font-extrabold leading-none tracking-[-0.03em]">{confirmed.length}</p>
              <p className="mt-1 text-pf-14 font-medium">{t("workDashConfirmed")}</p>
            </a>
            <a href="#work-active" className="block min-h-11">
              <p className="text-pf-48 font-extrabold leading-none tracking-[-0.03em]">{open.length}</p>
              <p className="mt-1 text-pf-14 font-medium">{t("workDashActive")}</p>
            </a>
          </div>
          {preview ? (
            <p className="mt-4 text-pf-16 text-pf-on-panel/80">
              {preview.title}
              {preview.when_label ? ` · ${preview.when_label}` : ""}
            </p>
          ) : (
            <p className="mt-4 text-pf-16 text-pf-on-panel/80">{t("workHomeQuiet")}</p>
          )}
        </section>
      )}

      <section id="work-confirmed" className="space-y-2">
        <h2 className="text-pf-18 font-medium text-pf-ink">{t("workDashConfirmed")}</h2>
        {requests != null && confirmed.length === 0 ? (
          <p className="text-pf-14 text-pf-text-secondary">{t("workDashConfirmedEmpty")}</p>
        ) : null}
        {confirmed.map((row) => {
          const order = deliveryCard(row, to);
          const price = quoteLabel(row);
          return (
            <OrderCard
              key={row.id}
              audience="staff"
              order={order}
              onQuote={() => router.push(`${to("/inbox")}?quote=${encodeURIComponent(row.id)}`)}
              onCalendar={() =>
                downloadVisitIcs({
                  id: row.id,
                  title: row.title,
                  whenLabel: row.when_label,
                  details: row.description,
                  who: row.target_name,
                  price: price ? t("calendarPriceLine", { amount: price }) : null,
                })
              }
            />
          );
        })}
      </section>

      <section id="work-active" className="space-y-2">
        <h2 className="text-pf-18 font-medium text-pf-ink">{t("workDashActive")}</h2>
        {requests != null && open.length === 0 ? (
          <p className="text-pf-14 text-pf-text-secondary">{t("workDashActiveEmpty")}</p>
        ) : null}
        {open.map((row) => {
          const order = deliveryCard(row, to);
          return (
            <OrderCard
              key={row.id}
              audience="staff"
              order={order}
              onQuote={() => router.push(`${to("/inbox")}?quote=${encodeURIComponent(row.id)}`)}
            />
          );
        })}
      </section>

      {tasks.length ? (
        <section className="space-y-2">
          <h2 className="text-pf-18 font-medium text-pf-ink">{t("companyToday")}</h2>
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => openTask(task.id)}
              className="block w-full rounded-[20px] border border-pf-line bg-pf-card p-4 text-left"
            >
              {task.property ? <p className="text-pf-12 font-medium text-pf-slate-ink">{task.property}</p> : null}
              <p className="mt-1 text-pf-18 font-medium text-pf-ink">{task.title}</p>
              {task.due ? <p className="mt-1 text-pf-14 text-pf-text-secondary">{dayLabel(task.due, locale)}</p> : null}
            </button>
          ))}
        </section>
      ) : null}

      {needsProfile ? (
        <Link href={to("/settings#your-profile")} className="block rounded-[20px] border border-pf-line bg-pf-card p-4">
          <p className="text-pf-16 font-medium text-pf-ink">{t("workHomeProfile")}</p>
        </Link>
      ) : null}
    </div>
  );
}
