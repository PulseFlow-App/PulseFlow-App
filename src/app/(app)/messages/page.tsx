"use client";

import { useEffect, useRef, useState, useOptimistic, startTransition } from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { useData } from "@/lib/data/use-app-data";
import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

export default function MessagesPage() {
  const data = useData();
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimistic, addOptimistic] = useOptimistic(
    data.messages,
    (state, newMsg: MessageWithSender) => [...state, newMsg],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimistic.length]);

  if (!data.ready || !data.profile) return <LoadingState />;

  const send = () => {
    const text = body.trim();
    if (!text) return;
    setError(null);
    const temp: MessageWithSender = {
      id: `temp-${Date.now()}`,
      org_id: data.profile!.org_id,
      sender_id: data.profile!.id,
      body: text,
      created_at: new Date().toISOString(),
      service_order_id: null,
      sender: {
        id: data.profile!.id,
        full_name: data.profile!.full_name,
        role: data.profile!.role,
      },
    };
    setBody("");
    startTransition(async () => {
      addOptimistic(temp);
      try {
        await data.sendMessage(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send.");
      }
    });
  };

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col animate-rise">
      <div className="mb-3">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("messages.title")}
        </h1>
        <p className="text-sm text-muted">{t("messages.subtitle")}</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {optimistic.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              {t("messages.empty")}
            </p>
          ) : (
            optimistic.map((msg) => {
              const mine = msg.sender_id === data.profile?.id;
              const order = msg.service_order_id
                ? data.serviceOrders.find((o) => o.id === msg.service_order_id)
                : null;
              const needsAgree =
                order &&
                order.status === "pending_ack" &&
                order.staff_profile_id === data.profile?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-2",
                    mine ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                      mine
                        ? "bg-primary text-white"
                        : "bg-sand text-ink",
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                        {msg.sender?.full_name ?? t("messages.teammate")}
                      </p>
                    ) : null}
                    <p>{msg.body}</p>
                  </div>
                  {needsAgree && msg.service_order_id ? (
                    <div className="w-[80%]">
                      <AgreeButton orderId={msg.service_order_id} />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-black/5 p-3">
          {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("messages.placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button
              aria-label="Send"
              onClick={send}
              className="shrink-0 px-3"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
