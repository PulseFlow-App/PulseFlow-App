"use client";

import { useEffect, useState } from "react";
import { Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

/** Property photo shown on property cards and job acceptance. */
export function VillaPhoto({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#F0EDE6]",
        className,
      )}
    >
      {/* data URLs + remote demo photos */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

export function VillaPhotoThumb({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <VillaPhoto
      src={src}
      alt={alt}
      className={cn("aspect-[4/3] w-full", className)}
    />
  );
}

/** Tappable property photo that opens a full-screen expand overlay. */
export function ExpandableVillaPhoto({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "group relative block overflow-hidden bg-[#F0EDE6] text-left",
          className ?? "w-full rounded-2xl",
        )}
        aria-label={t("guest.expandPhoto")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="aspect-[4/3] h-full w-full object-cover" />
        <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-ink/55 text-white opacity-90 transition group-hover:bg-ink/70">
          <Expand className="size-4" aria-hidden />
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-10 items-center justify-center rounded-full bg-white text-ink"
            aria-label={t("guest.closePhoto")}
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
