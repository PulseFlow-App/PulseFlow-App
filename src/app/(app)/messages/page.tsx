"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useOptimistic,
  startTransition,
} from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, EmptyState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { useData } from "@/lib/data/use-app-data";
import { cn } from "@/lib/utils";
import type { MessageWithSender, Profile } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";
import { canUseTeamChat } from "@/lib/roles";
import {
  EVERYONE_LABEL,
  applyMention,
  buildMentionOptions,
  getActiveMention,
  mentionSegments,
  type MentionPick,
} from "@/lib/mentions";

export default function MessagesPage() {
  const data = useData();
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimistic, addOptimistic] = useOptimistic(
    data.messages,
    (state, newMsg: MessageWithSender) => [...state, newMsg],
  );

  const teammates = useMemo(
    () => data.profiles.filter((p) => p.org_id === data.profile?.org_id),
    [data.profiles, data.profile?.org_id],
  );

  const activeMention = useMemo(
    () => getActiveMention(body, cursor),
    [body, cursor],
  );

  const mentionOptions = useMemo(() => {
    if (!activeMention || !data.profile || mentionDismissed) return [];
    return buildMentionOptions(
      teammates,
      activeMention.query,
      data.profile.id,
    );
  }, [activeMention, teammates, data.profile, mentionDismissed]);

  useEffect(() => {
    setMentionIndex(0);
  }, [activeMention?.query]);

  useEffect(() => {
    setMentionDismissed(false);
  }, [activeMention?.atIndex]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimistic.length]);

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (data.unreadMessageCount <= 0) return;
    void data.markAllNotificationsRead("message");
    // Clear chat badge when the conversation is opened / while viewing new pings.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open clear
  }, [data.ready, data.profile?.id, data.unreadMessageCount]);

  if (!data.ready || !data.profile) return <LoadingState />;

  if (!canUseTeamChat(data.orgKind)) {
    return (
      <EmptyState
        title="Team chat is for companies"
        description="Personal workspaces stay solo. Company plans unlock shared chat with managers and staff."
      />
    );
  }

  const pickMention = (pick: MentionPick) => {
    if (!activeMention) return;
    const label =
      pick.kind === "everyone" ? EVERYONE_LABEL : pick.profile.full_name;
    const next = applyMention(body, cursor, activeMention, label);
    setBody(next.text);
    setCursor(next.cursor);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.cursor, next.cursor);
    });
  };

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
    setCursor(0);
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
                      mine ? "bg-primary text-white" : "bg-sand text-ink",
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                        {msg.sender?.full_name ?? t("messages.teammate")}
                      </p>
                    ) : null}
                    <MessageBody
                      body={msg.body}
                      profiles={teammates}
                      mine={mine}
                    />
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
        <div className="relative border-t border-black/5 p-3">
          {mentionOptions.length > 0 ? (
            <ul
              className="absolute bottom-full left-3 right-14 z-10 mb-1 max-h-44 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1 soft-shadow"
              role="listbox"
            >
              {mentionOptions.map((pick, i) => (
                <li
                  key={
                    pick.kind === "everyone"
                      ? "everyone"
                      : pick.profile.id
                  }
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === mentionIndex}
                    className={cn(
                      "flex w-full flex-col px-3 py-2 text-left text-sm",
                      i === mentionIndex ? "bg-primary/10" : "hover:bg-sand",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickMention(pick);
                    }}
                  >
                    <span className="font-semibold text-ink">
                      {pick.kind === "everyone"
                        ? "@everyone"
                        : pick.profile.full_name}
                    </span>
                    <span className="text-xs text-muted capitalize">
                      {pick.kind === "everyone"
                        ? "Notify the whole team"
                        : pick.profile.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setCursor(e.target.selectionStart ?? e.target.value.length);
              }}
              onSelect={(e) => {
                const el = e.currentTarget;
                setCursor(el.selectionStart ?? 0);
              }}
              onClick={(e) => {
                setCursor(e.currentTarget.selectionStart ?? 0);
              }}
              placeholder={`${t("messages.placeholder")} (@name / @everyone)`}
              onKeyDown={(e) => {
                if (mentionOptions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionIndex((i) =>
                      Math.min(i + 1, mentionOptions.length - 1),
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionIndex((i) => Math.max(i - 1, 0));
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const pick = mentionOptions[mentionIndex];
                    if (pick) pickMention(pick);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setMentionDismissed(true);
                    setMentionIndex(0);
                    return;
                  }
                }
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

function MessageBody({
  body,
  profiles,
  mine,
}: {
  body: string;
  profiles: Profile[];
  mine: boolean;
}) {
  const segments = mentionSegments(body, profiles);
  return (
    <p>
      {segments.map((seg, i) =>
        seg.type === "mention" || seg.type === "everyone" ? (
          <span
            key={`${seg.type}-${i}`}
            className={cn(
              "font-bold",
              mine ? "text-white underline decoration-white/50" : "text-primary",
            )}
          >
            {seg.value}
          </span>
        ) : (
          <span key={`t-${i}`}>{seg.value}</span>
        ),
      )}
    </p>
  );
}
