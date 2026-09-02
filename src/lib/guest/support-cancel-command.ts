const GUEST_CANCEL_RE = /^\/cancel\s*$/i;

export function parseCancelCommand(
  body: string,
  role: "guest" | "owner" | "manager" | "staff" | string | undefined,
): boolean {
  if (role !== "guest") return false;
  return GUEST_CANCEL_RE.test(body.trim());
}
