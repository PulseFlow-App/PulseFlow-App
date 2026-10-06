import type { Contact, Profile, Task, Villa } from "@/lib/types";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match @Name or bare name against teammates (longest name first). */
export function resolveTeammate(
  query: string,
  profiles: Profile[],
): Profile | null {
  const q = normalize(query.replace(/^@/, ""));
  if (!q) return null;
  const candidates = profiles
    .filter((p) => p.role !== "guest")
    .slice()
    .sort((a, b) => b.full_name.length - a.full_name.length);
  return (
    candidates.find((p) => normalize(p.full_name) === q) ??
    candidates.find((p) => normalize(p.full_name).startsWith(q)) ??
    candidates.find((p) => normalize(p.full_name).includes(q)) ??
    null
  );
}

export function resolveVilla(query: string, villas: Villa[]): Villa | null {
  const q = normalize(query);
  if (!q) return null;
  const sorted = villas
    .slice()
    .sort((a, b) => b.name.length - a.name.length);
  return (
    sorted.find((v) => normalize(v.name) === q) ??
    sorted.find((v) => normalize(v.name).startsWith(q)) ??
    sorted.find((v) => normalize(v.name).includes(q)) ??
    null
  );
}

/** Pull trailing villa name from free text; returns remaining title + villa. */
export function peelVillaFromText(
  text: string,
  villas: Villa[],
): { rest: string; villa: Villa | null } {
  const trimmed = text.trim();
  if (!trimmed) return { rest: "", villa: null };
  const sorted = villas
    .slice()
    .sort((a, b) => b.name.length - a.name.length);
  const lower = trimmed.toLowerCase();
  for (const villa of sorted) {
    const name = villa.name.trim();
    if (!name) continue;
    const n = name.toLowerCase();
    if (lower === n) return { rest: "", villa };
    if (lower.endsWith(` ${n}`)) {
      return {
        rest: trimmed.slice(0, trimmed.length - name.length).trim(),
        villa,
      };
    }
  }
  return { rest: trimmed, villa: null };
}

/** First @mention token in text, if any. */
export function extractMentionToken(text: string): string | null {
  const m = text.match(/@([^\s@]+(?:\s+[^\s@]+){0,3})/);
  return m?.[1]?.trim() ?? null;
}

export function stripMention(text: string, mention: string) {
  return text
    .replace(new RegExp(`@${escapeRegExp(mention)}`, "i"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveContactForProfile(
  profileId: string,
  contacts: Contact[],
): Contact | null {
  return contacts.find((c) => c.linked_profile_id === profileId) ?? null;
}

export function resolveTask(
  query: string,
  tasks: Task[],
  statuses: Task["status"][] = ["open", "pending_verify"],
): Task | null {
  const q = normalize(query);
  const pool = tasks.filter((t) => statuses.includes(t.status));
  if (!q) return pool[0] ?? null;
  return (
    pool.find((t) => normalize(t.title) === q) ??
    pool.find((t) => normalize(t.title).includes(q)) ??
    pool.find((t) => t.id.toLowerCase().startsWith(q)) ??
    null
  );
}
