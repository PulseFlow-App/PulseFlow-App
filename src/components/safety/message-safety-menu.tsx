"use client";

import { useState } from "react";
import { Flag, MoreHorizontal, Ban } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/lib/i18n/provider";
import {
  blockUserLocally,
  isBlocked,
} from "@/lib/safety/blocks";
import { cn } from "@/lib/utils";

type MessageSafetyMenuProps = {
  viewerId: string;
  targetProfileId: string;
  targetName?: string;
  messageId: string;
  channel?: string;
  /** Invert colours when bubble is on primary / ink. */
  onDarkBubble?: boolean;
  onBlocked?: () => void;
};

export function MessageSafetyMenu({
  viewerId,
  targetProfileId,
  targetName,
  messageId,
  channel,
  onDarkBubble,
  onBlocked,
}: MessageSafetyMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (viewerId === targetProfileId) return null;
  if (isBlocked(viewerId, targetProfileId)) return null;

  const runReport = async () => {
    setBusy(true);
    try {
      await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProfileId,
          messageId,
          channel: channel ?? null,
          reason: "abuse",
        }),
      });
      setDone(t("safety.reportThanks"));
    } catch {
      setDone(t("safety.reportThanks"));
    } finally {
      setBusy(false);
      setReportOpen(false);
      setOpen(false);
    }
  };

  const runBlock = async () => {
    setBusy(true);
    try {
      blockUserLocally(viewerId, targetProfileId, targetName);
      await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: targetProfileId }),
      });
      onBlocked?.();
      setDone(t("safety.blockDone"));
    } catch {
      onBlocked?.();
      setDone(t("safety.blockDone"));
    } finally {
      setBusy(false);
      setBlockOpen(false);
      setOpen(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={reportOpen}
        title={t("safety.reportTitle")}
        description={t("safety.reportConfirm")}
        confirmLabel={t("safety.report")}
        confirmVariant="danger"
        busy={busy}
        onConfirm={() => void runReport()}
        onClose={() => {
          if (!busy) setReportOpen(false);
        }}
      />
      <ConfirmDialog
        open={blockOpen}
        title={t("safety.blockTitle")}
        description={t("safety.blockConfirm", {
          name: targetName ?? t("messages.teammate"),
        })}
        confirmLabel={t("safety.block")}
        confirmVariant="danger"
        busy={busy}
        onConfirm={() => void runBlock()}
        onClose={() => {
          if (!busy) setBlockOpen(false);
        }}
      />
      <div className="relative inline-flex">
        <button
          type="button"
          aria-label={t("safety.menu")}
          aria-expanded={open}
          onClick={() => {
            setDone(null);
            setOpen((v) => !v);
          }}
          className={cn(
            "flex size-6 items-center justify-center rounded-full transition",
            onDarkBubble
              ? "text-white/70 hover:bg-white/15 hover:text-white"
              : "text-muted hover:bg-black/5 hover:text-ink",
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute end-0 top-7 z-50 min-w-[9.5rem] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/10"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs font-semibold text-ink hover:bg-canvas-deep"
                onClick={() => {
                  setOpen(false);
                  setReportOpen(true);
                }}
              >
                <Flag className="size-3.5 text-muted" />
                {t("safety.report")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs font-semibold text-danger hover:bg-canvas-deep"
                onClick={() => {
                  setOpen(false);
                  setBlockOpen(true);
                }}
              >
                <Ban className="size-3.5" />
                {t("safety.block")}
              </button>
            </div>
          </>
        ) : null}
      </div>
      {done ? (
        <p
          className={cn(
            "mt-1 text-[11px] font-semibold",
            onDarkBubble ? "text-white/80" : "text-secondary",
          )}
        >
          {done}
        </p>
      ) : null}
    </>
  );
}
