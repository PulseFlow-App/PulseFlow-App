/** Prefix stored on bot replies in the agent channel (same sender_id as the user). */
export const AGENT_REPLY_PREFIX = "[[pulse-agent]]\n";

export function isAgentReplyBody(body: string) {
  return body.startsWith(AGENT_REPLY_PREFIX);
}

export function stripAgentReplyPrefix(body: string) {
  return isAgentReplyBody(body)
    ? body.slice(AGENT_REPLY_PREFIX.length)
    : body;
}

export function wrapAgentReply(body: string) {
  const text = body.trim();
  if (!text) return `${AGENT_REPLY_PREFIX}(empty)`;
  if (isAgentReplyBody(text)) return text;
  return `${AGENT_REPLY_PREFIX}${text}`;
}
