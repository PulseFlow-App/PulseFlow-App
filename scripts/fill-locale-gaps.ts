/**
 * Fills dictionary gaps where a locale still mirrors English.
 * Run: npx tsx scripts/fill-locale-gaps.ts [locale...]
 * Example: npx tsx scripts/fill-locale-gaps.ts de fr es it th he my ru
 */
import fs from "node:fs";
import path from "node:path";
import en from "../src/lib/i18n/dictionaries/en";
import th from "../src/lib/i18n/dictionaries/th";
import my from "../src/lib/i18n/dictionaries/my";
import fr from "../src/lib/i18n/dictionaries/fr";
import de from "../src/lib/i18n/dictionaries/de";
import es from "../src/lib/i18n/dictionaries/es";
import it from "../src/lib/i18n/dictionaries/it";
import he from "../src/lib/i18n/dictionaries/he";
import ru from "../src/lib/i18n/dictionaries/ru";
import ar from "../src/lib/i18n/dictionaries/ar";
import type { Dictionary } from "../src/lib/i18n/dictionaries/en";
import type { Locale } from "../src/lib/i18n/types";
import { translateUserContent } from "../src/lib/translate/server";

const LOCALES: Record<Exclude<Locale, "en">, Dictionary> = {
  th,
  my,
  fr,
  de,
  es,
  it,
  he,
  ru,
  ar,
};

const BRAND_LATIN = "Pulse Flow";

const SKIP_KEYS = new Set<string>(["brand.name"]);

function shouldSkip(key: string, value: string): boolean {
  if (SKIP_KEYS.has(key)) return true;
  if (!value.trim()) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (value.includes("@") && value.includes(".")) return true;
  return false;
}

function protectPlaceholders(text: string): { safe: string; map: Map<string, string> } {
  const map = new Map<string, string>();
  let i = 0;
  const safe = text.replace(/\{[^}]+\}/g, (m) => {
    const token = `__PH${i++}__`;
    map.set(token, m);
    return token;
  });
  return { safe, map };
}

function restorePlaceholders(text: string, map: Map<string, string>): string {
  let out = text;
  for (const [token, original] of map) {
    out = out.split(token).join(original);
  }
  return out;
}

async function translateValue(text: string, locale: Locale): Promise<string> {
  if (locale === "en") return text;
  const parts = text.split("|");
  const out: string[] = [];
  for (const part of parts) {
    const { safe, map } = protectPlaceholders(part);
    const translated = await translateUserContent(safe, locale, "en");
    out.push(restorePlaceholders(translated, map));
    await sleep(50);
  }
  return out.join("|");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeTsString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function applyToDictionaryFile(locale: Exclude<Locale, "en">, updates: Record<string, string>) {
  const file = path.join(
    process.cwd(),
    `src/lib/i18n/dictionaries/${locale}.ts`,
  );
  let content = fs.readFileSync(file, "utf8");

  for (const [key, value] of Object.entries(updates)) {
    const escaped = escapeTsString(value);
    const re = new RegExp(
      `("${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*")([^"]*(?:\\\\.[^"]*)*)(")`,
    );
    if (re.test(content)) {
      content = content.replace(re, `$1${escaped}$3`);
      continue;
    }
    const reMultiline = new RegExp(
      `("${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*\\n\\s*")([^"]*(?:\\\\.[^"]*)*)(")`,
    );
    if (reMultiline.test(content)) {
      content = content.replace(reMultiline, `$1${escaped}$3`);
    }
  }

  fs.writeFileSync(file, content);
}

async function fillLocale(locale: Exclude<Locale, "en">) {
  const dict = LOCALES[locale];
  const updates: Record<string, string> = {};

  if (dict["brand.name"] === en["brand.name"]) {
    updates["brand.name"] = BRAND_LATIN;
  }

  const keys = Object.keys(en) as (keyof Dictionary)[];
  let done = 0;
  for (const key of keys) {
    if (dict[key] !== en[key]) continue;
    const value = en[key];
    if (shouldSkip(key, value)) {
      if (key === "brand.name") updates[key] = BRAND_LATIN;
      continue;
    }
    try {
      updates[key] = await translateValue(value, locale);
      done++;
      if (done % 20 === 0) {
        console.log(`[${locale}] translated ${done}…`);
      }
    } catch (e) {
      console.warn(`[${locale}] skip ${key}:`, e);
    }
  }

  applyToDictionaryFile(locale, updates);
  console.log(`[${locale}] wrote ${Object.keys(updates).length} updates`);
}

async function main() {
  const targets = (process.argv.slice(2) as Exclude<Locale, "en">[]).filter(
    (l) => l in LOCALES,
  );

  if (!targets.length) {
    console.error("Usage: npx tsx scripts/fill-locale-gaps.ts de fr es …");
    process.exit(1);
  }

  for (const locale of targets) {
    await fillLocale(locale);
  }
}

void main();
