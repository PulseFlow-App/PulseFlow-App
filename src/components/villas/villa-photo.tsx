"use client";

import { cn } from "@/lib/utils";

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
