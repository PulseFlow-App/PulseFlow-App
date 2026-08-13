import type { Profile } from "@/lib/types";

export const EVERYONE_LABEL = "everyone";

export type MentionQuery = {
  /** Index of the `@` in the text */
  atIndex: number;
  /** Text after `@` up to cursor (may include spaces for full names) */
  query: string;
};

export type MentionPick =
  | { kind: "everyone" }
  | { kind: "person"; profile: Profile };

/**
 * Detect an active @mention being typed at the cursor.
 * Allows one space for multi-word names; ends on double-space or newline.
 */
export function getActiveMention(
  text: string,
  cursor: number,
): MentionQuery | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && /[\w]/.test(before[at - 1]!)) return null;
  const query = before.slice(at + 1);
  if (query.includes("\n")) return null;
  if (/\s{2}/.test(query)) return null;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length > 3) return null;
  return { atIndex: at, query };
}

export function filterMentionCandidates(
  profiles: Profile[],
  query: string,
  excludeId?: string | null,
): Profile[] {
  const q = query.trim().toLowerCase();
  return profiles
    .filter((p) => p.id !== excludeId)
    .filter((p) => {
      if (!q) return true;
      const name = p.full_name.toLowerCase();
      return name.startsWith(q) || name.split(/\s+/).some((w) => w.startsWith(q));
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

/** Autocomplete rows: @everyone (when query matches) plus teammate names. */
export function buildMentionOptions(
  profiles: Profile[],
  query: string,
  excludeId?: string | null,
): MentionPick[] {
  const q = query.trim().toLowerCase();
  const options: MentionPick[] = [];
  if (!q || EVERYONE_LABEL.startsWith(q)) {
    options.push({ kind: "everyone" });
  }
  for (const profile of filterMentionCandidates(profiles, query, excludeId).slice(
    0,
    6,
  )) {
    options.push({ kind: "person", profile });
  }
  return options;
}

/** Insert `@label ` replacing the active mention query. */
export function applyMention(
  text: string,
  cursor: number,
  mention: MentionQuery,
  label: string,
): { text: string; cursor: number } {
  const insert = `@${label} `;
  const next = text.slice(0, mention.atIndex) + insert + text.slice(cursor);
  const nextCursor = mention.atIndex + insert.length;
  return { text: next, cursor: nextCursor };
}

const EVERYONE_RE = /(?:^|[\s([{])@everyone(?=$|[\s,.;:!?)\]}])/gi;

export function hasEveryoneMention(body: string): boolean {
  EVERYONE_RE.lastIndex = 0;
  return EVERYONE_RE.test(body);
}

/**
 * Find profile IDs mentioned via @Name or @everyone in message body.
 * @everyone returns every profile in the list (caller should filter org / self).
 */
export function mentionedProfileIds(
  body: string,
  profiles: Profile[],
): string[] {
  if (hasEveryoneMention(body)) {
    return profiles.map((p) => p.id);
  }

  const sorted = [...profiles].sort(
    (a, b) => b.full_name.length - a.full_name.length,
  );
  const found = new Set<string>();
  const lower = body.toLowerCase();

  for (const p of sorted) {
    const needle = `@${p.full_name.toLowerCase()}`;
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx < 0) break;
      const beforeOk = idx === 0 || /[\s([{]/.test(body[idx - 1]!);
      const afterIdx = idx + needle.length;
      const afterOk =
        afterIdx >= body.length || /[\s,.;:!?)\]}]/.test(body[afterIdx]!);
      if (beforeOk && afterOk) found.add(p.id);
      from = idx + needle.length;
    }
  }
  return [...found];
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; profileId: string }
  | { type: "everyone"; value: string };

/** Split message body into text / mention segments for rendering. */
export function mentionSegments(
  body: string,
  profiles: Profile[],
): MentionSegment[] {
  if (!body) return [{ type: "text", value: "" }];
  const sorted = [...profiles].sort(
    (a, b) => b.full_name.length - a.full_name.length,
  );
  type Hit =
    | { start: number; end: number; kind: "person"; profileId: string; label: string }
    | { start: number; end: number; kind: "everyone"; label: string };
  const hits: Hit[] = [];

  const lowerBody = body.toLowerCase();
  let fromEveryone = 0;
  while (fromEveryone < body.length) {
    const idx = lowerBody.indexOf("@everyone", fromEveryone);
    if (idx < 0) break;
    const end = idx + "@everyone".length;
    const beforeOk = idx === 0 || /[\s([{]/.test(body[idx - 1]!);
    const afterOk = end >= body.length || /[\s,.;:!?)\]}]/.test(body[end]!);
    if (beforeOk && afterOk) {
      hits.push({
        start: idx,
        end,
        kind: "everyone",
        label: body.slice(idx, end),
      });
    }
    fromEveryone = idx + 1;
  }

  for (const p of sorted) {
    const needle = `@${p.full_name}`;
    const lowerNeedle = needle.toLowerCase();
    let from = 0;
    while (from < body.length) {
      const idx = lowerBody.indexOf(lowerNeedle, from);
      if (idx < 0) break;
      const end = idx + needle.length;
      const beforeOk = idx === 0 || /[\s([{]/.test(body[idx - 1]!);
      const afterOk = end >= body.length || /[\s,.;:!?)\]}]/.test(body[end]!);
      const overlaps = hits.some((h) => idx < h.end && end > h.start);
      if (beforeOk && afterOk && !overlaps) {
        hits.push({
          start: idx,
          end,
          kind: "person",
          profileId: p.id,
          label: body.slice(idx, end),
        });
      }
      from = idx + 1;
    }
  }

  hits.sort((a, b) => a.start - b.start);
  const segments: MentionSegment[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) {
      segments.push({ type: "text", value: body.slice(cursor, hit.start) });
    }
    if (hit.kind === "everyone") {
      segments.push({ type: "everyone", value: hit.label });
    } else {
      segments.push({
        type: "mention",
        value: hit.label,
        profileId: hit.profileId,
      });
    }
    cursor = hit.end;
  }
  if (cursor < body.length) {
    segments.push({ type: "text", value: body.slice(cursor) });
  }
  return segments.length ? segments : [{ type: "text", value: body }];
}
