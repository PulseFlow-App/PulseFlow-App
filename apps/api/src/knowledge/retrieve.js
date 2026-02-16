/**
 * RAG retrieval: load knowledge entries by block and filter by pattern_tags.
 * Entries live in apps/ai-engine/knowledge/entries/<block>.json
 * Use when calling LLM: retrieve by block + tags, cap at maxEntries, inject into context.
 */
const path = require('path');
const fs = require('fs');

const ENTRIES_DIR = path.resolve(__dirname, '../../../ai-engine/knowledge/entries');
const DEFAULT_MAX_ENTRIES = 5;

/**
 * Load all entries for a block.
 * @param {string} block - One of: nutrition, sleep, stress, energy, mood, hydration, body_signals, fridge
 * @returns {Array<object>} Array of knowledge entries
 */
function loadBlock(block) {
  const file = path.join(ENTRIES_DIR, `${block}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Retrieve entries for a block whose pattern_tags intersect with the given tags.
 * @param {string} block - Block name (e.g. nutrition, sleep)
 * @param {string[]} patternTags - Tags from rule engine (e.g. late_first_meal, low_energy)
 * @param {{ maxEntries?: number }} options - maxEntries caps results (default 5)
 * @returns {Array<object>} Matching entries, up to maxEntries
 */
function retrieve(block, patternTags, options = {}) {
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const entries = loadBlock(block);
  if (!Array.isArray(patternTags) || patternTags.length === 0) {
    return entries.slice(0, maxEntries);
  }
  const tagSet = new Set(patternTags.map((t) => String(t).toLowerCase()));
  const matching = entries.filter((entry) => {
    const entryTags = entry.pattern_tags || [];
    return entryTags.some((t) => tagSet.has(String(t).toLowerCase()));
  });
  return matching.slice(0, maxEntries);
}

/**
 * Build pattern_tags from Nutrition pattern_type + drivers for retrieval.
 * Splits pattern_type on '_' and keeps segments that look like tags (e.g. late_first_meal, low_energy).
 * @param {string} patternType - e.g. late_first_meal_low_energy, reactive_hydration
 * @param {string[]} drivers - e.g. ['late_first_meal', 'low_energy']
 * @returns {string[]} Tags to pass to retrieve()
 */
function nutritionPatternToTags(patternType, drivers = []) {
  const fromDrivers = drivers || [];
  const fromType = patternType ? [patternType] : [];
  // Also add sub-parts of pattern_type (e.g. late_first_meal_low_energy → keep as one tag; entries may use it or parts)
  const combined = [...new Set([...fromType, ...fromDrivers])];
  return combined.filter(Boolean);
}

module.exports = {
  loadBlock,
  retrieve,
  nutritionPatternToTags,
  DEFAULT_MAX_ENTRIES,
};
