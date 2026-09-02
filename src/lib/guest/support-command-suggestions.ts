import type { MessageKey } from "@/lib/i18n";

export type SupportCommandSuggestion = {
  command: string;
  descriptionKey: MessageKey;
};

export const GUEST_SUPPORT_COMMANDS: SupportCommandSuggestion[] = [
  {
    command: "/deposit",
    descriptionKey: "guest.supportCmdDeposit",
  },
  {
    command: "/cancel",
    descriptionKey: "guest.supportCmdCancel",
  },
];

export const HOST_SUPPORT_COMMANDS: SupportCommandSuggestion[] = [
  {
    command: "/deposit",
    descriptionKey: "guest.supportCmdDepositHost",
  },
  {
    command: "/refund",
    descriptionKey: "guest.supportCmdRefund",
  },
];

/** Slash commands matching partial input at the start of the message (before a space). */
export function supportCommandSuggestions(
  input: string,
  commands: SupportCommandSuggestion[],
): SupportCommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  const token = input.match(/^\/[^\s]*/)?.[0] ?? input;
  if (input.length > token.length) return [];
  const q = token.toLowerCase();
  return commands.filter((c) => c.command.startsWith(q) && c.command !== q);
}

/** @deprecated Use supportCommandSuggestions with GUEST_SUPPORT_COMMANDS */
export function guestSupportCommandSuggestions(input: string) {
  return supportCommandSuggestions(input, GUEST_SUPPORT_COMMANDS);
}
