"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LocalizedText } from "@/components/i18n/localized-text";
import { isSupportSystemMessage } from "@/lib/guest/support-deposit-command";
import type { SupportMessageWithSender } from "@/lib/types";

type SupportMessageBubbleProps = {
  message: SupportMessageWithSender;
  mine: boolean;
  hostLabel: string;
  receiptLabel: string;
};

export function SupportMessageBubble({
  message,
  mine,
  hostLabel,
  receiptLabel,
}: SupportMessageBubbleProps) {
  const system = isSupportSystemMessage(message.body);
  const hasAttachment = Boolean(message.attachment_url);
  const hasBody = Boolean(message.body.trim());

  return (
    <div
      className={cn(
        "flex",
        system ? "justify-center" : mine ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] space-y-2 rounded-2xl px-3 py-2 text-sm",
          system
            ? "bg-secondary/10 text-secondary"
            : mine
              ? "bg-primary text-white"
              : "bg-[#F7F5F1] text-ink",
        )}
      >
        {!mine && !system ? (
          <p className="mb-0.5 text-[11px] font-bold opacity-70">
            {message.sender?.full_name ?? hostLabel}
          </p>
        ) : null}
        {hasBody ? (
          <LocalizedText
            text={message.body}
            as="p"
            className="whitespace-pre-wrap"
          />
        ) : null}
        {hasAttachment && message.attachment_url ? (
          <Link
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "block overflow-hidden rounded-xl ring-1",
              mine ? "ring-white/30" : "ring-black/10",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachment_url}
              alt={receiptLabel}
              className="max-h-56 w-full object-cover"
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
