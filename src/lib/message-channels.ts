import type { AppNotification, Message, MessageChannel } from "@/lib/types";
import {
  isChatBadgeNotification,
  unreadNotifications,
} from "@/lib/notifications";

export const MESSAGE_CHANNELS: MessageChannel[] = [
  "request",
  "photo",
  "general",
];

export function parseMessageChannel(
  value: string | null | undefined,
): MessageChannel | null {
  if (value === "request" || value === "photo" || value === "general") {
    return value;
  }
  return null;
}

export function teamChatHref(channel: MessageChannel = "general") {
  return `/messages?channel=${channel}`;
}

/** Prefer explicit URL channel, else the channel of the newest unread team message. */
export function resolveTeamChatChannel(input: {
  urlChannel?: string | null;
  messages: Pick<Message, "id" | "channel">[];
  notifications: AppNotification[];
  profileId: string;
  fallback?: MessageChannel;
}): MessageChannel {
  const fromUrl = parseMessageChannel(input.urlChannel);
  if (fromUrl) return fromUrl;

  const unread = unreadNotifications(
    input.notifications,
    input.profileId,
  ).filter(
    (n) =>
      isChatBadgeNotification(n) &&
      n.kind === "message" &&
      Boolean(n.entity_id),
  );

  for (const n of unread) {
    const msg = input.messages.find((m) => m.id === n.entity_id);
    if (msg) return msg.channel ?? "general";
  }

  return input.fallback ?? "request";
}

export function unreadTeamChatCountByChannel(input: {
  messages: Pick<Message, "id" | "channel">[];
  notifications: AppNotification[];
  profileId: string;
}): Record<MessageChannel, number> {
  const counts: Record<MessageChannel, number> = {
    request: 0,
    photo: 0,
    general: 0,
  };

  const unread = unreadNotifications(
    input.notifications,
    input.profileId,
  ).filter(
    (n) =>
      isChatBadgeNotification(n) &&
      n.kind === "message" &&
      Boolean(n.entity_id),
  );

  for (const n of unread) {
    const msg = input.messages.find((m) => m.id === n.entity_id);
    if (!msg) continue;
    const channel = msg.channel ?? "general";
    counts[channel] += 1;
  }

  return counts;
}
