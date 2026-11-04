"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appOriginForHost, servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

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

export default function CompanyTodayPage() {
  const { actor, actorReady, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [tasks, setTasks] = useState<CompanyTask[] | null>(null);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  useEffect(() => {
    if (!actorReady) return;
    if (!actor) {
      router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/company"))}`);
      return;
    }
    let cancelled = false;
    void fetch("/api/services/company-tasks", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { tasks: [] }))
      .then((payload: { tasks?: CompanyTask[] }) => {
        if (!cancelled) setTasks(payload.tasks ?? []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, actorReady, pathname, router, start]);

  if (!tasks) return null;
  const [focus, ...rest] = tasks;
  const open = (id: string) => {
    const origin = appOriginForHost(window.location.host, window.location.protocol);
    window.location.assign(`${origin}/tasks?focus=${id}`);
  };

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("companyToday")}</h1>
      {focus ? (
        <button
          type="button"
          onClick={() => open(focus.id)}
          className="w-full rounded-[28px] bg-pf-navy-900 p-5 text-left text-pf-on-panel"
        >
          {focus.property ? <p className="text-pf-14 text-pf-on-panel/80">{focus.property}</p> : null}
          <p className="text-pf-22 font-bold tracking-[-0.02em]">{focus.title}</p>
          {focus.due ? <p className="mt-1 text-pf-14 text-pf-on-panel/80">{dayLabel(focus.due, locale)}</p> : null}
          <span className="mt-3 inline-flex min-h-11 items-center text-pf-14 font-medium underline">
            {t("openInPulse")}
          </span>
        </button>
      ) : (
        <p className="text-pf-16 text-pf-text-secondary">{t("companyTodayNone")}</p>
      )}
      {rest.length ? (
        <ul className="space-y-2">
          {rest.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => open(task.id)}
                className="w-full rounded-[20px] border border-pf-line bg-pf-card p-4 text-left"
              >
                {task.property ? <p className="text-pf-14 text-pf-text-secondary">{task.property}</p> : null}
                <p className="font-bold text-pf-ink">{task.title}</p>
                {task.due ? <p className="mt-1 text-pf-14 text-pf-text-secondary">{dayLabel(task.due, locale)}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
