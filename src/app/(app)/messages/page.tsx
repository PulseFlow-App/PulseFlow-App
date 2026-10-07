"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useOptimistic,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Send, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, EmptyState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { useData } from "@/lib/data/use-app-data";
import { cn } from "@/lib/utils";
import type { MessageChannel, MessageWithSender, Profile } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { LocalizedText } from "@/components/i18n/localized-text";
import { canUseAgentChat, canUseTeamChat, isGuestApp } from "@/lib/roles";
import { isJobSystemChatBody } from "@/lib/demo/localize";
import {
  GuestSupportChat,
  HostSupportInbox,
} from "@/components/home/guest-support";
import {
  EVERYONE_LABEL,
  applyMention,
  buildMentionOptions,
  getActiveMention,
  mentionSegments,
  type MentionPick,
} from "@/lib/mentions";
import {
  parseMessageChannel,
  resolveTeamChatChannel,
  unreadTeamChatCountByChannel,
} from "@/lib/message-channels";
import { teamChatCommandSuggestions } from "@/lib/team-chat-commands";
import {
  agentCommandPickText,
  agentCommandSuggestions,
  runAgentCommand,
  type AgentChip,
  type VillaIntake,
} from "@/lib/agent-chat/commands";
import {
  isAgentReplyBody,
  stripAgentReplyPrefix,
  wrapAgentReply,
} from "@/lib/agent-chat/markers";

const TEAM_CHANNELS: {
  id: MessageChannel;
  labelKey: MessageKey;
  hintKey: MessageKey;
}[] = [
  {
    id: "request",
    labelKey: "messages.channel.request",
    hintKey: "messages.channel.requestHint",
  },
  {
    id: "photo",
    labelKey: "messages.channel.photo",
    hintKey: "messages.channel.photoHint",
  },
  {
    id: "general",
    labelKey: "messages.channel.general",
    hintKey: "messages.channel.generalHint",
  },
];

const AGENT_CHANNEL = {
  id: "agent" as const,
  labelKey: "messages.channel.agent" as MessageKey,
  hintKey: "messages.channel.agentHint" as MessageKey,
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MessagesPageInner />
    </Suspense>
  );
}

function MessagesPageInner() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlChannel = parseMessageChannel(searchParams.get("channel"));
  const [channel, setChannel] = useState<MessageChannel>(
    urlChannel ?? "request",
  );
  const [channelReady, setChannelReady] = useState(Boolean(urlChannel));
  const [body, setBody] = useState("");
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentChips, setAgentChips] = useState<AgentChip[]>([]);
  const [agentAllowPhoto, setAgentAllowPhoto] = useState(false);
  const [villaIntake, setVillaIntake] = useState<VillaIntake | null>(null);
  const [localAgent, setLocalAgent] = useState<MessageWithSender[]>([]);
  const villaIntakeRef = useRef<VillaIntake | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelMessages = useMemo(() => {
    const live = data.messages.filter(
      (m) => (m.channel ?? "general") === channel,
    );
    if (channel !== "agent") return live;
    const ids = new Set(live.map((m) => m.body));
    const extras = localAgent.filter((m) => !ids.has(m.body));
    return [...live, ...extras];
  }, [data.messages, channel, localAgent]);

  const [optimistic, addOptimistic] = useOptimistic(
    channelMessages,
    (state, newMsg: MessageWithSender) => [...state, newMsg],
  );

  const teammates = useMemo(
    () => data.profiles.filter((p) => p.org_id === data.profile?.org_id),
    [data.profiles, data.profile?.org_id],
  );

  const showAgent = Boolean(
    data.profile && canUseAgentChat(data.profile.role),
  );
  const channels = useMemo(
    () => (showAgent ? [...TEAM_CHANNELS, AGENT_CHANNEL] : TEAM_CHANNELS),
    [showAgent],
  );

  const unreadByChannel = useMemo(() => {
    if (!data.profile) {
      return {
        request: 0,
        photo: 0,
        general: 0,
        agent: 0,
      } as Record<MessageChannel, number>;
    }
    return unreadTeamChatCountByChannel({
      messages: data.messages,
      notifications: data.notifications,
      profileId: data.profile.id,
    });
  }, [data.messages, data.notifications, data.profile]);

  const activeMention = useMemo(
    () => (channel === "agent" ? null : getActiveMention(body, cursor)),
    [body, cursor, channel],
  );

  const mentionOptions = useMemo(() => {
    if (!activeMention || !data.profile || mentionDismissed) return [];
    return buildMentionOptions(
      teammates,
      activeMention.query,
      data.profile.id,
    );
  }, [activeMention, teammates, data.profile, mentionDismissed]);

  const agentSuggestions = useMemo(
    () => (channel === "agent" ? agentCommandSuggestions(body) : []),
    [body, channel],
  );
  const teamSuggestions = useMemo(
    () => (channel === "agent" ? [] : teamChatCommandSuggestions(body)),
    [body, channel],
  );

  const selectChannel = (next: MessageChannel, replaceUrl = true) => {
    setChannel(next);
    if (!replaceUrl) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("channel", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (urlChannel) {
      setChannel(urlChannel);
      setChannelReady(true);
    }
  }, [urlChannel]);

  useEffect(() => {
    if (!data.ready || !data.profile || channelReady) return;
    const next = resolveTeamChatChannel({
      urlChannel: searchParams.get("channel"),
      messages: data.messages,
      notifications: data.notifications,
      profileId: data.profile.id,
    });
    if (next === "agent" && !canUseAgentChat(data.profile.role)) {
      selectChannel("request");
    } else {
      selectChannel(next);
    }
    setChannelReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- settle once when data is ready
  }, [
    data.ready,
    data.profile?.id,
    data.messages,
    data.notifications,
    channelReady,
    searchParams,
  ]);

  useEffect(() => {
    if (!data.profile) return;
    if (channel === "agent" && !canUseAgentChat(data.profile.role)) {
      selectChannel("request");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guard role/channel mismatch
  }, [channel, data.profile?.role]);

  useEffect(() => {
    setMentionIndex(0);
  }, [activeMention?.query]);

  useEffect(() => {
    setMentionDismissed(false);
  }, [activeMention?.atIndex]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimistic.length, channel]);

  useEffect(() => {
    villaIntakeRef.current = villaIntake;
  }, [villaIntake]);

  useEffect(() => {
    setBody("");
    setPendingPhoto(null);
    setError(null);
    if (channel !== "agent") {
      setAgentChips([]);
      setAgentAllowPhoto(false);
    }
  }, [channel]);

  useEffect(() => {
    if (!data.ready || !data.profile || !channelReady) return;
    if (data.unreadMessageCount <= 0) return;
    void data.markAllNotificationsRead("message");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open clear after channel pick
  }, [data.ready, data.profile?.id, data.unreadMessageCount, channelReady]);

  if (!data.ready || !data.profile) return <LoadingState />;

  if (isGuestApp(data.profile.role)) {
    return <GuestSupportChat />;
  }

  if (!canUseTeamChat(data.orgKind, data.profile.role)) {
    return (
      <EmptyState
        title={t("messages.companyOnly")}
        description={t("messages.companyOnlyHint")}
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

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url =
        channel === "agent"
          ? await data.uploadVillaPhoto(file)
          : await data.uploadChatAttachment(file);
      if (!url) throw new Error(t("common.error"));
      setPendingPhoto(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const makeTemp = (
    text: string,
    extra?: Partial<MessageWithSender>,
  ): MessageWithSender => {
    const profile = data.profile!;
    return {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      org_id: profile.org_id,
      sender_id: profile.id,
      body: text || " ",
      created_at: new Date().toISOString(),
      service_order_id: null,
      channel,
      attachment_url: extra?.attachment_url ?? null,
      audience_profile_ids: channel === "agent" ? [profile.id] : null,
      sender: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
      },
      ...extra,
    };
  };

  const submitAgent = async (input: {
    text: string;
    chipId?: string;
    photoUrl?: string | null;
  }) => {
    const profile = data.profile;
    if (!profile || agentBusy) return;
    const text = input.text.trim();
    const photoUrl = input.photoUrl ?? null;
    if (!text && !photoUrl && !input.chipId) return;

    setError(null);
    setAgentChips([]);
    setBody("");
    setCursor(0);
    setPendingPhoto(null);
    setAgentBusy(true);

    const userMsg = makeTemp(text || (input.chipId ? input.chipId : " "), {
      attachment_url: photoUrl,
    });
    setLocalAgent((rows) => [...rows, userMsg]);

    try {
      if (text || photoUrl || input.chipId) {
        try {
          await data.sendMessage(text || " ", { channel: "agent" });
        } catch {
          /* Reply still runs locally if the channel is not migrated yet. */
        }
      }
      const result = await runAgentCommand(text, {
        profile,
        organization: data.organization,
        profiles: data.profiles,
        villas: data.villas,
        tasks: data.tasks,
        bills: data.bills,
        serviceOrders: data.serviceOrders,
        contacts: data.contacts,
        createTask: data.createTask,
        setTaskStatus: data.setTaskStatus,
        createServiceOrder: data.createServiceOrder,
        createVilla: data.createVilla,
      }, {
        photoUrl,
        chipId: input.chipId,
        intake: villaIntakeRef.current,
      });
      setVillaIntake(result.intake);
      villaIntakeRef.current = result.intake;
      setAgentChips(result.turn.chips ?? []);
      setAgentAllowPhoto(Boolean(result.turn.allowPhoto));
      const botMsg = makeTemp(wrapAgentReply(result.turn.text));
      setLocalAgent((rows) => [...rows, botMsg]);
      try {
        await data.sendMessage(result.turn.text, {
          channel: "agent",
          agentReply: true,
        });
      } catch {
        /* Shown in-thread even if persistence fails. */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setAgentBusy(false);
    }
  };

  const send = () => {
    const text = body.trim();
    if (channel === "agent") {
      void submitAgent({
        text,
        photoUrl: pendingPhoto,
      });
      return;
    }
    if (channel === "photo") {
      if (!pendingPhoto) {
        setError(t("messages.photoRequired"));
        return;
      }
      if (!text && !pendingPhoto) return;
    } else if (!text) {
      return;
    }
    setError(null);
    const attachmentUrl = channel === "photo" ? pendingPhoto : null;
    const temp = makeTemp(text || " ", { attachment_url: attachmentUrl });
    setBody("");
    setCursor(0);
    setPendingPhoto(null);
    void (async () => {
      addOptimistic(temp);
      try {
        await data.sendMessage(text || " ", {
          channel,
          attachmentUrl,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send.");
      }
    })();
  };

  return (
    <div className="space-y-3 animate-rise">
      <HostSupportInbox />
      <div className="flex h-[calc(100dvh-9.5rem)] flex-col">
        <div className="mb-3">
          <h1 className="type-title">{t("messages.title")}</h1>
          <p className="type-meta mt-1">{t("messages.subtitle")}</p>
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {channels.map((c) => {
            const active = channel === c.id;
            const unread = unreadByChannel[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectChannel(c.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-primary text-white"
                    : "bg-card text-muted shadow-sm",
                )}
                title={t(c.hintKey)}
              >
                {t(c.labelKey)}
                {unread > 0 ? (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-primary text-white",
                    )}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {channel === "photo" ? (
            <p className="border-b border-black/5 bg-[#F7F5F1] px-3 py-2 text-xs leading-relaxed text-muted">
              {t("messages.photoNote")}
            </p>
          ) : null}
          {channel === "agent" ? (
            <p className="whitespace-pre-wrap border-b border-black/5 bg-[#F7F5F1] px-3 py-2 text-xs leading-relaxed text-muted">
              {t("messages.agentNote")}
            </p>
          ) : null}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {optimistic.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                {channel === "agent"
                  ? t("messages.agentEmpty")
                  : t("messages.empty")}
              </p>
            ) : (
              optimistic.map((msg) => {
                const agentReply = isAgentReplyBody(msg.body);
                const mine =
                  !agentReply && msg.sender_id === data.profile?.id;
                const order = msg.service_order_id
                  ? data.serviceOrders.find((o) => o.id === msg.service_order_id)
                  : null;
                const showAgreeUi =
                  order &&
                  data.profile &&
                  (order.status === "pending_ack" ||
                    (order.status === "agreed" &&
                      (order.staff_profile_id === data.profile.id ||
                        order.ordered_by === data.profile.id)));
                const displayBody = agentReply
                  ? stripAgentReplyPrefix(msg.body)
                  : msg.body;
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
                        "max-w-[80%] space-y-2 rounded-2xl px-3 py-2 text-sm",
                        mine
                          ? "bg-primary text-white"
                          : agentReply
                            ? "bg-ink text-white"
                            : "bg-sand text-ink",
                      )}
                    >
                      {!mine ? (
                        <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                          {agentReply
                            ? t("messages.agentBotName")
                            : (msg.sender?.full_name ?? t("messages.teammate"))}
                        </p>
                      ) : null}
                      {msg.attachment_url ? (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "block overflow-hidden rounded-xl ring-1",
                            mine || agentReply
                              ? "ring-white/30"
                              : "ring-black/10",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.attachment_url}
                            alt=""
                            className="max-h-56 w-full object-cover"
                          />
                        </a>
                      ) : null}
                      {displayBody.trim() ? (
                        <div className="whitespace-pre-wrap">
                          <MessageBody
                            body={displayBody}
                            profiles={teammates}
                            mine={mine || agentReply}
                          />
                        </div>
                      ) : null}
                    </div>
                    {showAgreeUi && msg.service_order_id ? (
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
            {agentSuggestions.length > 0 ? (
              <ul
                className="absolute bottom-full left-3 right-14 z-10 mb-1 max-h-52 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1 soft-shadow"
                role="listbox"
              >
                {agentSuggestions.map((cmd) => {
                  const pick = agentCommandPickText(cmd);
                  return (
                    <li key={cmd.command}>
                      <button
                        type="button"
                        role="option"
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-sand"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (cmd.runOnPick) {
                            setBody("");
                            void submitAgent({ text: cmd.command });
                            return;
                          }
                          setBody(pick);
                          setCursor(pick.length);
                          requestAnimationFrame(() =>
                            inputRef.current?.focus(),
                          );
                        }}
                      >
                        <span className="font-semibold text-ink">
                          {cmd.command}
                        </span>
                        <span className="text-xs text-muted">
                          {t(cmd.descriptionKey)}
                          {cmd.hint ? ` (${cmd.hint})` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {teamSuggestions.length > 0 ? (
              <ul
                className="absolute bottom-full left-3 right-14 z-10 mb-1 max-h-44 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1 soft-shadow"
                role="listbox"
              >
                {teamSuggestions.map((cmd) => (
                  <li key={cmd.command}>
                    <button
                      type="button"
                      role="option"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-sand"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBody(`${cmd.command} `);
                        setCursor(cmd.command.length + 1);
                        requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                    >
                      <span className="font-semibold text-ink">{cmd.command}</span>
                      <span className="text-xs text-muted">
                        {t(cmd.descriptionKey)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {mentionOptions.length > 0 ? (
              <ul
                className="absolute bottom-full left-3 right-14 z-10 mb-1 max-h-44 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1 soft-shadow"
                role="listbox"
              >
                {mentionOptions.map((pick, i) => (
                  <li
                    key={
                      pick.kind === "everyone" ? "everyone" : pick.profile.id
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
                          ? t("messages.everyone")
                          : pick.profile.full_name}
                      </span>
                      <span className="text-xs text-muted capitalize">
                        {pick.kind === "everyone"
                          ? t("messages.everyoneHint")
                          : pick.profile.role}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
            {channel === "agent" && agentBusy ? (
              <p className="mb-2 text-xs text-muted">{t("messages.agentWorking")}</p>
            ) : null}
            {channel === "agent" && agentChips.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {agentChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={agentBusy}
                    className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink"
                    onClick={() =>
                      void submitAgent({ text: chip.label, chipId: chip.id })
                    }
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            ) : null}
            {(channel === "photo" ||
              (channel === "agent" && (agentAllowPhoto || pendingPhoto))) &&
            pendingPhoto ? (
              <div className="mb-2 flex items-start gap-2">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPhoto}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label={t("messages.removePhoto")}
                    onClick={() => setPendingPhoto(null)}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              {channel === "photo" ||
              (channel === "agent" && agentAllowPhoto) ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void onPickPhoto(e.target.files?.[0] ?? null)
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    className="h-8 w-8 shrink-0 px-0"
                    disabled={uploading}
                    aria-label={t("messages.attachPhoto")}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="size-3.5" />
                  </Button>
                </>
              ) : null}
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
                placeholder={
                  channel === "photo"
                    ? t("messages.placeholderPhoto")
                    : channel === "agent"
                      ? t("messages.placeholderAgent")
                      : t("messages.placeholder")
                }
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
                size="xs"
                onClick={send}
                className="h-8 w-8 shrink-0 px-0"
                disabled={uploading || agentBusy}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
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
  // Job system posts are stored in English templates. Localize the full body
  // first — splitting @mentions would break the pattern match.
  if (isJobSystemChatBody(body)) {
    return (
      <LocalizedText
        text={body}
        as="p"
        multiline
        className="whitespace-pre-wrap"
      />
    );
  }

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
          <LocalizedText key={`t-${i}`} text={seg.value} />
        ),
      )}
    </p>
  );
}
