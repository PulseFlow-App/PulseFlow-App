import type { MessageKey } from "@/lib/i18n";

export const TEAM_CHAT_COMMANDS = [
  {
    command: "/cancel job",
    descriptionKey: "messages.cmdCancelJob" as MessageKey,
  },
];

export function teamChatCommandSuggestions(input: string) {
  if (!input.startsWith("/")) return [];
  const q = input.toLowerCase();
  return TEAM_CHAT_COMMANDS.filter((c) => {
    const cmd = c.command.toLowerCase();
    return cmd.startsWith(q) && cmd !== q.trimEnd();
  });
}
