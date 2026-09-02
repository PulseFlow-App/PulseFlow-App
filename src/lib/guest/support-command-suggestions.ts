import type { MessageKey } from "@/lib/i18n";

export type GuestSupportCommand = {
  command: string;
  descriptionKey: MessageKey;
};

export const GUEST_SUPPORT_COMMANDS: GuestSupportCommand[] = [
  {
    command: "/deposit",
    descriptionKey: "guest.supportCmdDeposit",
  },
  {
    command: "/cancel",
    descriptionKey: "guest.supportCmdCancel",
  },
];

/** Slash commands matching partial input at the start of the message (before a space). */
export function guestSupportCommandSuggestions(
  input: string,
): GuestSupportCommand[] {
  if (!input.startsWith("/")) return [];
  const token = input.match(/^\/[^\s]*/)?.[0] ?? input;
  if (input.length > token.length) return [];
  const q = token.toLowerCase();
  return GUEST_SUPPORT_COMMANDS.filter(
    (c) => c.command.startsWith(q) && c.command !== q,
  );
}
