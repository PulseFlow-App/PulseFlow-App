/**
 * Force-translate all demo.* dictionary keys (seed copy) for each locale.
 * Run: npx tsx scripts/fill-demo-locale-gaps.ts he th my fr es it ru
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

const HOME_KEYS = [
  "home.due",
  "home.checkInsOuts",
  "home.noMoves",
  "home.weekVolumeClosed",
  "home.closedLabel",
  "home.openedLabel",
  "home.chartOpened",
  "home.chartClosed",
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
  const parts = text.split("|");
  const out: string[] = [];
  for (const part of parts) {
    const { safe, map } = protectPlaceholders(part);
    let translated = await translateUserContent(safe, locale, "en");
    if (translated === safe && locale !== "en") {
      await sleep(300);
      translated = await translateUserContent(safe, locale, "en");
    }
    out.push(restorePlaceholders(translated, map));
    await sleep(80);
  }
  return out.join("|");
}

function escapeTsString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function applyToDictionaryFile(
  locale: Exclude<Locale, "en">,
  updates: Record<string, string>,
) {
  const file = path.join(
    process.cwd(),
    `src/lib/i18n/dictionaries/${locale}.ts`,
  );
  let content = fs.readFileSync(file, "utf8");

  for (const [key, value] of Object.entries(updates)) {
    const escaped = escapeTsString(value);
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`("${escapedKey}":\\s*")([^"]*(?:\\\\.[^"]*)*)(")`),
      new RegExp(`("${escapedKey}":\\s*\\n\\s*")([^"]*(?:\\\\.[^"]*)*)(")`),
    ];
    let replaced = false;
    for (const re of patterns) {
      if (re.test(content)) {
        content = content.replace(re, `$1${escaped}$3`);
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      console.warn(`[${locale}] could not patch key ${key}`);
    }
  }

  fs.writeFileSync(file, content);
}

async function fillDemoLocale(locale: Exclude<Locale, "en">) {
  if (locale === "de") {
    console.log(`[${locale}] skip (manual de demo patch)`);
    return;
  }

  const dict = LOCALES[locale];
  const keys = [
    ...Object.keys(en).filter((k) => k.startsWith("demo.")),
    ...HOME_KEYS,
  ] as (keyof Dictionary)[];

  const updates: Record<string, string> = {};
  let done = 0;

  for (const key of keys) {
    const source = en[key];
    if (!source || dict[key] !== en[key]) continue;

    try {
      const translated = await translateValue(source, locale);
      if (translated && translated !== en[key]) {
        updates[key] = translated;
        done++;
        if (done % 15 === 0) console.log(`[${locale}] ${done} demo keys…`);
      } else {
        console.warn(`[${locale}] unchanged: ${key}`);
      }
    } catch (e) {
      console.warn(`[${locale}] failed ${key}`, e);
    }
  }

  applyToDictionaryFile(locale, updates);
  console.log(`[${locale}] wrote ${Object.keys(updates).length} demo/home keys`);
}

async function main() {
  const targets = (process.argv.slice(2) as Exclude<Locale, "en">[]).filter(
    (l) => l in LOCALES,
  );
  if (!targets.length) {
    console.error("Usage: npx tsx scripts/fill-demo-locale-gaps.ts he th …");
    process.exit(1);
  }
  for (const locale of targets) {
    await fillDemoLocale(locale);
  }
}

void main();
