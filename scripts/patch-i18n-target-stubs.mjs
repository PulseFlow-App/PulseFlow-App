#!/usr/bin/env node
/**
 * Patch education.*, bookings.*, villas.ical*, calendarExport.*Steps,
 * home.openBookingCalendar, and demo.* stubs in locale dictionaries.
 * Replaces only when value equals English (or is still English / Sync variants).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_DIR = path.join(__dirname, "../src/lib/i18n/dictionaries");
const PACK_DIR = path.join(__dirname, "i18n-stub-packs");
const LOCALES = ["ar", "de", "es", "fr", "he", "it", "my", "ru", "th", "tr"];

const BRAND_ONLY = new Set([
  "bookings.source.airbnb",
  "bookings.source.booking",
  "bookings.source.vrbo",
]);

const KNOWN_EN_VARIANTS = new Set([
  "Pick Airbnb, Booking, or Guesty for where to find the export link, then paste it and Sync.",
  "{count} night synced|{count} nights synced",
  "Could not sync that calendar link.",
  "Sync an Airbnb or Booking.com calendar, or confirm a guest stay.",
  "No calendar feeds yet. open a property → Quick fill → paste Export calendar URL → Sync.",
  "No calendar feeds yet. Tap Connect calendar, paste an Export calendar URL, then Sync.",
  "Host calendar → pick the listing → Availability → Connect calendars → Connect to another website → copy the Export calendar link (.ics). Paste it below, then Sync.",
  "Booking.com Extranet → Rates & Availability (or Calendar) → Sync calendars → Export calendar → copy the private link. Paste it below, then Sync.",
  "Guesty → Properties → listing → Calendar → Calendar sync (iCal) → Export Guesty calendar → copy the iCalendar URL. Paste it below, then Sync. For the whole portfolio, use Settings → Guesty instead.",
]);

function isTargetKey(k) {
  return (
    k.startsWith("education.") ||
    k === "home.openBookingCalendar" ||
    k.startsWith("villas.icalUrl") ||
    k.startsWith("villas.icalSync") ||
    k.startsWith("villas.icalUnlink") ||
    k === "calendarExport.airbnbSteps" ||
    k === "calendarExport.bookingSteps" ||
    k === "calendarExport.guestySteps" ||
    k.startsWith("bookings.") ||
    k.startsWith("demo.")
  );
}

function parseDict(file) {
  const src = fs.readFileSync(path.join(DICT_DIR, file), "utf8");
  let body;
  if (file === "en.ts") {
    body = src.match(/const \w+ = \{([\s\S]*)\} as const;/)[1];
  } else {
    body = src.match(
      /const \w+: Dictionary = \{([\s\S]*)\};\s*\n\s*export default/,
    )[1];
  }
  return Function(`return {${body}}`)();
}

function looksLatinEnglish(value) {
  if (!value || typeof value !== "string") return false;
  if (!/[A-Za-z]{4,}/.test(value)) return false;
  // Mostly Latin / punctuation / digits / placeholders
  const nonLatin = value.replace(
    /[\s\d{}|.,;:!?'"()\-–—→·฿$€%/\\nA-Za-z]/g,
    "",
  );
  return nonLatin.length === 0;
}

function isStub(key, value, enValue, locale) {
  if (BRAND_ONLY.has(key)) return false;
  if (value === enValue) return true;
  if (KNOWN_EN_VARIANTS.has(value)) return true;
  if (/\b(Sync|synced)\b/i.test(value) && looksLatinEnglish(value)) return true;
  // Hebrew Sync product wording left from earlier drafts
  if (
    locale === "he" &&
    (key.startsWith("bookings.") ||
      key.startsWith("villas.ical") ||
      key.startsWith("calendarExport.")) &&
    /סנכר|סנכרון/.test(value)
  ) {
    return true;
  }
  // Script locales: leftover Latin English
  if (
    ["ar", "he", "th", "my"].includes(locale) &&
    looksLatinEnglish(value) &&
    value !== enValue &&
    !BRAND_ONLY.has(key)
  ) {
    // Keep intentional brand-only shorts already handled; also keep
    // menu-path-heavy calendarExport if fully English Sync variants caught above.
    if (key.startsWith("calendarExport.") || key.startsWith("bookings.") ||
        key.startsWith("villas.ical") || key.startsWith("education.") ||
        key.startsWith("demo.") || key === "home.openBookingCalendar") {
      return true;
    }
  }
  return false;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceKey(src, key, newValue) {
  const keyRe = escapeRegExp(key);
  // "key": "value"  OR  "key":\n    "value"
  const re = new RegExp(
    `("${keyRe}"\\s*:\\s*)(?:"(?:\\\\.|[^"\\\\])*")`,
    "m",
  );
  if (!re.test(src)) {
    return { src, ok: false };
  }
  const next = src.replace(re, `$1${JSON.stringify(newValue)}`);
  return { src: next, ok: true };
}

function main() {
  const en = parseDict("en.ts");
  const targetKeys = Object.keys(en).filter(isTargetKey);
  const report = {};

  for (const locale of LOCALES) {
    const packPath = path.join(PACK_DIR, `${locale}.json`);
    if (!fs.existsSync(packPath)) {
      console.error(`Missing pack: ${packPath}`);
      process.exit(1);
    }
    const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
    const file = `${locale}.ts`;
    let src = fs.readFileSync(path.join(DICT_DIR, file), "utf8");
    const dict = parseDict(file);
    let updated = 0;
    const updatedKeys = [];

    for (const key of targetKeys) {
      if (!(key in pack)) continue;
      if (!(key in dict)) continue;
      const current = dict[key];
      const desired = pack[key];
      if (desired === undefined) continue;
      if (!isStub(key, current, en[key], locale)) continue;
      if (current === desired) continue;
      const res = replaceKey(src, key, desired);
      if (!res.ok) {
        console.warn(`[${locale}] could not replace ${key}`);
        continue;
      }
      src = res.src;
      updated += 1;
      updatedKeys.push(key);
    }

    fs.writeFileSync(path.join(DICT_DIR, file), src);
    report[locale] = { updated, keys: updatedKeys };
    console.log(`${locale}: updated ${updated} keys`);
  }

  fs.writeFileSync(
    path.join(PACK_DIR, "_last-patch-report.json"),
    JSON.stringify(report, null, 2),
  );
}

main();
