#!/usr/bin/env node
/**
 * Count remaining same-as-en stubs for education.*, villas.ical*,
 * bookings.*, demo.*, home.openBookingCalendar (excluding brand-only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_DIR = path.join(__dirname, "../src/lib/i18n/dictionaries");
const LOCALES = ["ar", "de", "es", "fr", "he", "it", "my", "ru", "th", "tr"];

const BRAND_ONLY = new Set([
  "bookings.source.airbnb",
  "bookings.source.booking",
  "bookings.source.vrbo",
]);

function isTarget(k) {
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
  const body =
    file === "en.ts"
      ? src.match(/const \w+ = \{([\s\S]*)\} as const;/)[1]
      : src.match(
          /const \w+: Dictionary = \{([\s\S]*)\};\s*\n\s*export default/,
        )[1];
  return Function(`return {${body}}`)();
}

/** Values that are only placeholders + punctuation (not real English prose). */
function isPlaceholderOnly(v) {
  return /^[\s{}|.,;:!?'"()\-–—→·฿$€%/A-Za-z0-9_]*$/.test(v) &&
    /\{[a-zA-Z]+\}/.test(v) &&
    !/[A-Za-z]{4,}/.test(v.replace(/\{[a-zA-Z]+\}/g, ""));
}

const en = parseDict("en.ts");
const keys = Object.keys(en).filter(isTarget);
const patchReportPath = path.join(
  __dirname,
  "i18n-stub-packs/_last-patch-report.json",
);
const patchReport = fs.existsSync(patchReportPath)
  ? JSON.parse(fs.readFileSync(patchReportPath, "utf8"))
  : {};

console.log("Keys updated per locale (last patch run):");
for (const loc of LOCALES) {
  const u = patchReport[loc]?.updated ?? "?";
  console.log(`  ${loc}: ${u}`);
}

console.log("\nRemaining same-as-en (excl. brand-only / empty):");
const summary = {};
for (const loc of LOCALES) {
  const d = parseDict(`${loc}.ts`);
  const stubs = [];
  const placeholderSame = [];
  for (const k of keys) {
    if (BRAND_ONLY.has(k)) continue;
    if (en[k] === "") continue;
    if (d[k] !== en[k]) continue;
    if (isPlaceholderOnly(en[k])) placeholderSame.push(k);
    else stubs.push(k);
  }
  summary[loc] = {
    remainingProse: stubs.length,
    placeholderOnlySame: placeholderSame.length,
    stubs,
    placeholderSame,
  };
  console.log(
    `  ${loc}: prose=${stubs.length} placeholder-only=${placeholderSame.length}`,
  );
  if (stubs.length) console.log(`    prose: ${stubs.join(", ")}`);
  if (placeholderSame.length)
    console.log(`    placeholders: ${placeholderSame.join(", ")}`);
}

fs.writeFileSync(
  path.join(__dirname, "i18n-stub-packs/_verify-report.json"),
  JSON.stringify({ patchReport, summary }, null, 2),
);
