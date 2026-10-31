"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

function readRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  const pad = 6;
  return {
    top: Math.max(0, r.top - pad),
    left: Math.max(0, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

/** Wait for data-tour target; return null if not found. */
export function useTourTarget(tourId: string | null | undefined, active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !tourId) {
      setRect(null);
      setLabel(null);
      return;
    }

    let cancelled = false;
    let tries = 0;
    let raf = 0;

    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${tourId}"]`);
      if (el) {
        setRect(readRect(el));
        setLabel(el.getAttribute("data-tour-label") || el.getAttribute("aria-label"));
        tries = 0;
      } else {
        setRect(null);
        setLabel(null);
        tries += 1;
      }
      // Keep following layout for a while
      if (tries < 40 || el) {
        raf = window.setTimeout(tick, el ? 120 : 80);
      }
    };

    tick();
    const onScroll = () => {
      const el = document.querySelector(`[data-tour="${tourId}"]`);
      if (el) setRect(readRect(el));
    };
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelled = true;
      window.clearTimeout(raf);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [tourId, active]);

  return { rect, label };
}

export function EducationSpotlight({
  tourId,
  active,
}: {
  tourId: string | null;
  active: boolean;
}) {
  const { rect, label } = useTourTarget(tourId, active);
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[210]" aria-hidden>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]" />
      {rect ? (
        <>
          <div
            className={cn(
              "absolute rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-transparent",
              "bg-transparent shadow-[0_0_0_9999px_rgba(2,48,71,0.55)]",
            )}
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
          {label ? (
            <p
              className="absolute max-w-[min(16rem,70vw)] rounded-full bg-card px-3 py-1 text-xs font-semibold text-ink soft-shadow"
              style={{
                top: Math.min(rect.top + rect.height + 10, window.innerHeight - 40),
                left: Math.min(rect.left, window.innerWidth - 200),
              }}
            >
              {label}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
