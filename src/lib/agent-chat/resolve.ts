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

/**
 * Pull @Name from text using the longest matching teammate name, so
 * "/task Buy milk @Anastasia Maduewan Home" keeps the villa after the person.
 */
export function peelAssigneeFromText(
  text: string,
  profiles: Profile[],
): {
  assignee: Profile | null;
  rest: string;
  unmatchedMention: string | null;
} {
  const at = text.indexOf("@");
  if (at < 0) {
    return { assignee: null, rest: text.trim(), unmatchedMention: null };
  }
  const before = text.slice(0, at).trim();
  const after = text.slice(at + 1).trim();
  if (!after) {
    return { assignee: null, rest: before, unmatchedMention: "" };
  }

  const afterNorm = normalize(after);
  const candidates = profiles
    .filter((p) => p.role !== "guest")
    .slice()
    .sort((a, b) => b.full_name.length - a.full_name.length);

  for (const p of candidates) {
    const name = normalize(p.full_name);
    if (!name) continue;
    if (afterNorm === name || afterNorm.startsWith(`${name} `)) {
      const nameWords = p.full_name.trim().split(/\s+/).filter(Boolean).length;
      const afterWords = after.split(/\s+/).filter(Boolean);
      const restAfter = afterWords.slice(nameWords).join(" ").trim();
      const rest = [before, restAfter].filter(Boolean).join(" ").trim();
      return { assignee: p, rest, unmatchedMention: null };
    }
  }

  const first = after.split(/\s+/)[0] ?? after;
  return {
    assignee: null,
    rest: text.trim(),
    unmatchedMention: first,
  };
}

/** @deprecated Prefer peelAssigneeFromText for /task and /job. */
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

/** Collapse "/ task …" → "/task …" so spaced slash still works. */
export function normalizeAgentSlashInput(raw: string) {
  return raw.trim().replace(/^\/\s+/, "/");
}

/** Parse "/task Buy milk @Mai Coral" or "/ task Buy milk…". */
export function parseAgentSlash(raw: string): { cmd: string; args: string } {
  const text = normalizeAgentSlashInput(raw);
  if (!text.startsWith("/")) return { cmd: "", args: text };

  const m = text.match(/^\/([a-zA-Z][\w-]*)(?:\s+([\s\S]*))?$/);
  if (!m) {
    const token = text.split(/\s+/)[0] ?? "/";
    return { cmd: token.toLowerCase(), args: "" };
  }
  return {
    cmd: `/${(m[1] ?? "").toLowerCase()}`,
    args: (m[2] ?? "").trim(),
  };
}
