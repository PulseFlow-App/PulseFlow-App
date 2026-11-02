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
        "space-y-3 rounded-2xl border border-[var(--color-border)] bg-card/90 p-4 soft-shadow backdrop-blur-sm",
        className,
      )}
    >
      <div>
        <p className="type-sign text-[var(--color-sky)]">{t("guestAuthEyebrow")}</p>
        <h2 className="mt-1 font-display text-[length:var(--type-subtitle)] font-bold leading-snug tracking-[-0.02em] text-ink">
          {t("guestAuthTitle")}
        </h2>
        <p className="mt-1 text-sm leading-snug text-muted">{t("guestAuthBody")}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={start}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cta)] transition hover:brightness-[1.03] active:scale-[0.98]"
        >
          {t("signUp")}
        </Link>
        <Link
          href={signIn}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-canvas px-4 text-sm font-semibold text-ink transition hover:bg-canvas-deep active:scale-[0.98]"
        >
          {t("signIn")}
        </Link>
      </div>
    </section>
  );
}
