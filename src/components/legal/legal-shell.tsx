"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function LegalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/settings");
  };

  return (
    <div
      className="fixed inset-0 z-10 overflow-y-auto overscroll-y-contain bg-sand"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="mx-auto max-w-lg px-4 pb-16 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={goBack}
          className="sticky top-[max(0.5rem,env(safe-area-inset-top))] z-20 mb-4 inline-flex h-8 items-center gap-1 rounded-full border border-[var(--color-border)] bg-card px-2.5 text-xs font-semibold text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden /> Back
        </button>
        {children}
      </div>
    </div>
  );
}
