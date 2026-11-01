/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */

/** Pulse Flow Services mark: house, pulse, spark, and wrench. */
export function ServicesMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/brand/services-icon.png"
      alt=""
      width={1024}
      height={1024}
      draggable={false}
      className={`block shrink-0 object-contain ${className}`}
    />
  );
}
