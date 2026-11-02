"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Path to return to after auth (public marketplace path). */
  nextPath?: string;
};

export function GuestAuthStrip({ className, nextPath }: Props) {
  const { actor, t } = usePros();
  const pathname = usePathname();
  if (actor) return null;

  const to = (path: string) => servicesPath(pathname, path);
  const fallback = pathname.startsWith("/pros")
    ? pathname.slice("/pros".length) || "/"
    : pathname;
  const next = encodeURIComponent((nextPath ?? fallback) || "/");
  const start = to(`/start?next=${next}`);
  const signIn = to(`/start?mode=sign-in&next=${next}`);

  return (
    <section
      className={cn(
        "space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4",
        className,
      )}
    >
      <div>
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("guestAuthTitle")}
        </h2>
        <p className="mt-1 max-w-[70ch] text-pf-16 leading-snug text-pf-text-secondary">{t("guestAuthBody")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href={start}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
        >
          {t("signUp")}
        </Link>
        <Link
          href={signIn}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
        >
          {t("signIn")}
        </Link>
      </div>
    </section>
  );
}
