import type { ContactMessengerKind } from "@/lib/design-tokens";
import type { Contact, ContactMessenger } from "@/lib/types";

export const CONTACT_MESSENGER_KINDS: ContactMessengerKind[] = [
  "whatsapp",
  "line",
  "telegram",
];

export function messengerNeedsHandle(kind: ContactMessengerKind) {
  // WhatsApp uses phone. Telegram username is required for a link.
  // LINE also needs an ID for deep links.
  return kind === "telegram" || kind === "line";
}

export function parseContactMessengers(raw: unknown): ContactMessenger[] {
  if (!Array.isArray(raw)) return [];
  const out: ContactMessenger[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const kind = (item as { kind?: unknown }).kind;
    if (kind !== "whatsapp" && kind !== "line" && kind !== "telegram") continue;
    if (seen.has(kind)) continue;
    seen.add(kind);
    const handleRaw = (item as { handle?: unknown }).handle;
    const handle =
      typeof handleRaw === "string" && handleRaw.trim()
        ? handleRaw.trim()
        : null;
    out.push({ kind, handle });
  }
  return out;
}

/** Resolve messengers list, falling back to legacy single columns. */
export function contactMessengers(
  contact: Pick<Contact, "messengers" | "messenger" | "messenger_handle">,
): ContactMessenger[] {
  const fromList = parseContactMessengers(contact.messengers);
  if (fromList.length) return fromList;
  if (contact.messenger && contact.messenger !== "none") {
    return [
      {
        kind: contact.messenger,
        handle: contact.messenger_handle?.trim() || null,
      },
    ];
  }
  return [];
}

/** Persist list + keep legacy columns aligned with the first entry. */
export function syncContactMessengerFields(messengers: ContactMessenger[]) {
  const list = parseContactMessengers(messengers);
  const primary = list[0];
  return {
    messengers: list,
    messenger: (primary?.kind ?? "none") as Contact["messenger"],
    messenger_handle: primary?.handle ?? null,
  };
}

export function normalizeContactRow<T extends Partial<Contact>>(row: T): T & {
  messengers: ContactMessenger[];
  messenger: Contact["messenger"];
  messenger_handle: string | null;
} {
  const messengers = contactMessengers({
    messengers: row.messengers ?? [],
    messenger: row.messenger ?? "none",
    messenger_handle: row.messenger_handle ?? null,
  });
  return {
    ...row,
    ...syncContactMessengerFields(messengers),
  };
}
