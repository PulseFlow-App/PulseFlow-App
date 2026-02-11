/**
 * Input validation and sanitization to prevent malicious DB use and abuse.
 * - Enforce max lengths and allowed characters
 * - Allowlist body-log payload keys and limit size
 * - Reject dangerous or oversized input
 */

const MAX_EMAIL_LEN = 254;
const MAX_USER_ID_LEN = 256;
const MAX_REFERRER_CODE_LEN = 256;
const MAX_WALLET_LEN = 128;
const MAX_BODY_LOG_PAYLOAD_BYTES = 50 * 1024; // 50KB
const MAX_INSIGHTS_BODY_BYTES = 100 * 1024;   // 100KB
const MAX_ADMIN_POINTS = 1_000_000;
const MAX_NOTES_LEN = 5000;

// Allowed keys for body_logs payload (no __proto__, constructor, etc.)
const BODY_LOG_ALLOWED_KEYS = new Set([
  'sleepHours', 'sleepQuality', 'energy', 'mood', 'hydration', 'stress',
  'appetite', 'digestion', 'weight', 'notes', 'photoUri',
]);

const EMAIL_BASIC_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(x) {
  return typeof x === 'string' && x.trim().length > 0;
}

function hasControlOrNullBytes(str) {
  if (typeof str !== 'string') return true;
  return /[\x00-\x1f\x7f]/.test(str);
}

/** Validate and normalize email. Returns null if invalid. */
function validateEmail(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > MAX_EMAIL_LEN) return null;
  if (hasControlOrNullBytes(trimmed)) return null;
  if (!EMAIL_BASIC_REGEX.test(trimmed)) return null;
  return trimmed;
}

/** Validate userId / referrerCode: non-empty, bounded length, no control chars. */
function validateUserIdLike(input, maxLen = MAX_USER_ID_LEN) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return null;
  if (hasControlOrNullBytes(trimmed)) return null;
  return trimmed;
}

/** Validate wallet string length and no control chars. */
function validateWallet(input) {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (s.length > MAX_WALLET_LEN) return null;
  if (hasControlOrNullBytes(s)) return null;
  return s;
}

/** Sanitize body log payload: only allowed keys, bounded strings. */
function sanitizeBodyLogPayload(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out = {};
  for (const key of Object.keys(obj)) {
    if (!BODY_LOG_ALLOWED_KEYS.has(key)) continue;
    const val = obj[key];
    if (val === undefined) continue;
    if (typeof val === 'number' && Number.isFinite(val)) {
      out[key] = val;
      continue;
    }
    if (typeof val === 'string') {
      if (hasControlOrNullBytes(val)) continue;
      out[key] = val.length > MAX_NOTES_LEN ? val.slice(0, MAX_NOTES_LEN) : val;
    }
  }
  return out;
}

/** Check JSON string length for body (before parsing). */
function isBodyWithinLimit(req, maxBytes) {
  const len = req.get('content-length');
  if (len) {
    const n = parseInt(len, 10);
    if (!Number.isFinite(n) || n > maxBytes) return false;
  }
  return true;
}

/** Validate admin points amount: integer in [1, MAX_ADMIN_POINTS]. */
function validatePointsAmount(amount) {
  const n = typeof amount === 'number' ? Math.floor(amount) : parseInt(amount, 10);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_ADMIN_POINTS) return null;
  return n;
}

module.exports = {
  MAX_EMAIL_LEN,
  MAX_USER_ID_LEN,
  MAX_REFERRER_CODE_LEN,
  MAX_WALLET_LEN,
  MAX_BODY_LOG_PAYLOAD_BYTES,
  MAX_INSIGHTS_BODY_BYTES,
  MAX_ADMIN_POINTS,
  validateEmail,
  validateUserIdLike,
  validateWallet,
  sanitizeBodyLogPayload,
  isBodyWithinLimit,
  validatePointsAmount,
  isNonEmptyString,
};
