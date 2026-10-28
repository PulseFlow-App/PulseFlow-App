/** Parse pasted ops notes (doc / AI chat) into master-info fields. */

export type MasterInfoEnrichment = {
  utilities_notes?: string;
  service_providers_notes?: string;
  access_notes?: string;
  key_contacts_notes?: string;
  tax_notes?: string;
  handoff_notes?: string;
};

type FieldKey = keyof MasterInfoEnrichment;

const SECTION_ALIASES: { key: FieldKey; labels: string[] }[] = [
  {
    key: "utilities_notes",
    labels: [
      "utilities",
      "utility",
      "electric",
      "electricity",
      "water",
      "meters",
      "חשמל",
      "מים",
      "שירותים",
    ],
  },
  {
    key: "service_providers_notes",
    labels: [
      "service providers",
      "service provider",
      "providers",
      "vendors",
      "pool",
      "ac",
      "a/c",
      "electrician",
      "plumber",
      "ספקים",
      "נותני שירות",
    ],
  },
  {
    key: "access_notes",
    labels: [
      "access",
      "access & systems",
      "access and systems",
      "systems",
      "alarm",
      "panels",
      "shed",
      "גישה",
      "מערכות",
    ],
  },
  {
    key: "key_contacts_notes",
    labels: [
      "key contacts",
      "contacts",
      "emergency",
      "guard",
      "community",
      "אנשי קשר",
      "חירום",
    ],
  },
  {
    key: "tax_notes",
    labels: [
      "tax",
      "tax & assessments",
      "tax and assessments",
      "assessments",
      "land tax",
      "מיסים",
      "ארנונה",
    ],
  },
  {
    key: "handoff_notes",
    labels: [
      "handoff",
      "handoff notes",
      "notes",
      "offline",
      "ops notes",
      "master info",
      "העברה",
      "הערות",
    ],
  },
];

function normalizeLabel(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[:：\-–—|]+$/g, "")
    .replace(/\s+/g, " ");
}

function matchSection(label: string): FieldKey | null {
  const n = normalizeLabel(label);
  if (!n) return null;
  for (const section of SECTION_ALIASES) {
    for (const alias of section.labels) {
      if (n === alias || n.startsWith(`${alias} `)) return section.key;
    }
  }
  return null;
}

const HEADING_RE =
  /^(?:#{1,3}\s*|[-*•]\s*)?([A-Za-z\u0590-\u05FF &/]+)\s*[:：]\s*(.*)$/;

/**
 * Split pasted text into master-info sections.
 * Recognizes "Utilities:", "## Service providers", etc.
 * Unlabeled leading text goes to handoff_notes when no section matched.
 */
export function parseMasterInfoFromText(raw: string): MasterInfoEnrichment {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return {};

  const lines = text.split("\n");
  const buckets: Partial<Record<FieldKey, string[]>> = {};
  let current: FieldKey | null = null;
  const preamble: string[] = [];

  const push = (key: FieldKey, chunk: string) => {
    const t = chunk.trim();
    if (!t) return;
    (buckets[key] ??= []).push(t);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) push(current, "");
      continue;
    }

    const md = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (md?.[1]) {
      const key = matchSection(md[1]);
      if (key) {
        current = key;
        continue;
      }
    }

    const headed = trimmed.match(HEADING_RE);
    if (headed?.[1]) {
      const key = matchSection(headed[1]);
      if (key) {
        current = key;
        if (headed[2]?.trim()) push(key, headed[2]);
        continue;
      }
    }

    if (current) push(current, trimmed);
    else preamble.push(trimmed);
  }

  const out: MasterInfoEnrichment = {};
  for (const [key, parts] of Object.entries(buckets) as [FieldKey, string[]][]) {
    const joined = parts
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (joined) out[key] = joined;
  }

  if (preamble.length) {
    const lead = preamble.join("\n").trim();
    if (lead) {
      out.handoff_notes = out.handoff_notes
        ? `${lead}\n\n${out.handoff_notes}`
        : lead;
    }
  }

  // No headings at all → whole paste is handoff notes.
  if (
    !out.utilities_notes &&
    !out.service_providers_notes &&
    !out.access_notes &&
    !out.key_contacts_notes &&
    !out.tax_notes &&
    out.handoff_notes === text
  ) {
    return { handoff_notes: text };
  }

  return out;
}

/** Merge enrichment into an existing draft (parsed values win when non-empty). */
export function applyMasterInfoEnrichment<T extends MasterInfoEnrichment>(
  draft: T,
  enrichment: MasterInfoEnrichment,
): T {
  const next = { ...draft };
  for (const key of Object.keys(enrichment) as FieldKey[]) {
    const value = enrichment[key]?.trim();
    if (value) (next as MasterInfoEnrichment)[key] = value;
  }
  return next;
}
