/**
 * Pulse API — minimal backend for auth, body logs, insights, premium.
 * Uses Postgres when DATABASE_URL is set; otherwise in-memory (MVP).
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
const security = require('./security');

const app = express();

// Secure headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: restrict to allowed origins when set (never log credentials or tokens)
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
const corsOriginList = corsOriginsEnv ? corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean) : null;
const corsOptions = corsOrigin
  ? { origin: corsOrigin }
  : corsOriginList?.length
    ? { origin: (origin, cb) => cb(null, !origin || corsOriginList.includes(origin)) }
    : {}; // allow all when unset (e.g. dev)
app.use(cors(corsOptions));

// Limit JSON body size: 4MB for photo upload, 100kb for other routes
app.use((req, res, next) => {
  const isPhotoUpload = req.method === 'POST' && req.path === '/users/me/photos';
  express.json({ limit: isPhotoUpload ? '14mb' : '100kb' })(req, res, next);
});

// Rate limits: stricter for auth/referrals to prevent brute force and abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 50,
  message: { message: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 120,
  message: { message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth', authLimiter);
app.use('/referrals', authLimiter);
app.use('/', generalLimiter);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PORT = process.env.PORT || 3002;

// In-memory fallback when no DATABASE_URL
const users = new Map();
const bodyLogs = new Map();
const checkIns = new Map();
/** In-memory photo store: id -> { dataUrl, userId }. 3 MB max per image (keeps request under Vercel 4.5 MB body limit). */
const photoStore = new Map();
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function generatePhotoId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Validate data URL: image type and decoded size <= 3 MB. Returns { ok: true, dataUrl } or { ok: false, message }. */
function validatePhotoDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return { ok: false, message: 'Invalid image: must be a data URL (data:image/...)' };
  }
  const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,/i);
  if (!match) {
    return { ok: false, message: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
  const decodedBytes = Math.ceil((base64.length * 3) / 4);
  if (decodedBytes > MAX_PHOTO_BYTES) {
    return { ok: false, message: `Image too large. Maximum size is ${MAX_PHOTO_BYTES / (1024 * 1024)} MB` };
  }
  return { ok: true, dataUrl };
}

// ----- Auth (never log passwords, tokens, or raw Authorization headers) -----
app.post('/auth/sign-up', async (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = security.validateEmail(email);
  if (!trimmed || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (password.length > 1024) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (db.hasDb()) {
    try {
      const existing = await db.getUserByEmail(trimmed);
      if (existing) return res.status(400).json({ message: 'Email already registered' });
      const userId = generateId();
      const passwordHash = await bcrypt.hash(password, 10);
      await db.createUser(userId, trimmed, passwordHash);
      const accessToken = jwt.sign({ userId, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: { userId, email: trimmed }, accessToken });
    } catch (err) {
      console.error('sign-up db error', err);
      return res.status(500).json({ message: 'Sign up failed' });
    }
  }

  if (users.has(trimmed)) return res.status(400).json({ message: 'Email already registered' });
  const userId = generateId();
  users.set(trimmed, { userId, email: trimmed, passwordHash: password });
  const accessToken = jwt.sign({ userId, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: { userId, email: trimmed }, accessToken });
});

// Sync user from app login (Firebase or email demo) into DB so they appear in public.users
app.post('/auth/sync', async (req, res) => {
  const { email, userId } = req.body || {};
  const trimmed = security.validateEmail(email);
  if (!trimmed) {
    return res.status(400).json({ message: 'Email required', code: 'EMAIL_REQUIRED' });
  }
  const validatedUserId = userId != null ? security.validateUserIdLike(String(userId), security.MAX_USER_ID_LEN) : null;
  if (!db.hasDb()) {
    console.log('[auth/sync] No database; skipping sync for', trimmed);
    return res.json({ ok: true, message: 'No database', created: false });
  }
  try {
    const existing = await db.getUserByEmail(trimmed);
    if (existing) {
      db.updateLastSeen(existing.userId).catch(() => {});
      const accessToken = jwt.sign({ userId: existing.userId, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
      console.log('[auth/sync] User exists:', existing.userId, trimmed);
      return res.json({ ok: true, userId: existing.userId, created: false, accessToken });
    }
    const id = validatedUserId || generateId();
    const passwordHash = await bcrypt.hash(generateId(), 10);
    await db.createUser(id, trimmed, passwordHash, null);
    const accessToken = jwt.sign({ userId: id, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
    console.log('[auth/sync] User created:', id, trimmed);
    return res.status(201).json({ ok: true, userId: id, created: true, accessToken });
  } catch (err) {
    if (err.code === '23505') {
      const existing = await db.getUserByEmail(trimmed).catch(() => null);
      if (existing) {
        const accessToken = jwt.sign({ userId: existing.userId, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
        console.log('[auth/sync] Race: user exists after conflict:', existing.userId, trimmed);
        return res.json({ ok: true, userId: existing.userId, created: false, accessToken });
      }
    }
    console.error('[auth/sync] Error:', err.code || err.message, trimmed, err);
    const code = err?.code || '';
    const msg = code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT'
      ? 'Database unreachable. Check DATABASE_URL.'
      : 'Sync failed';
    return res.status(500).json({ message: msg, code: code || 'SYNC_FAILED' });
  }
});

app.post('/auth/sign-in', async (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = security.validateEmail(email);
  if (!trimmed || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (password.length > 1024) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (db.hasDb()) {
    try {
      const u = await db.getUserByEmail(trimmed);
      if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const accessToken = jwt.sign({ userId: u.userId, email: u.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: { userId: u.userId, email: u.email }, accessToken });
    } catch (err) {
      console.error('sign-in db error', err);
      return res.status(500).json({ message: 'Sign in failed' });
    }
  }

  const u = users.get(trimmed);
  if (!u || u.passwordHash !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const accessToken = jwt.sign({ userId: u.userId, email: u.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: { userId: u.userId, email: u.email }, accessToken });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function adminMiddleware(req, res, next) {
  if (!ADMIN_API_KEY) return res.status(503).json({ message: 'Admin API not configured' });
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token !== ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

// ----- Referrals: complete referral (new user + referral row + points in one transaction) -----
app.post('/referrals/complete', async (req, res) => {
  const { referrerCode, email, wallet } = req.body || {};
  const trimmed = security.validateEmail(email);
  const code = security.validateUserIdLike(referrerCode, security.MAX_REFERRER_CODE_LEN);
  if (!trimmed || !code) {
    return res.status(400).json({ message: 'referrerCode and email required' });
  }
  const walletVal = security.validateWallet(wallet);

  if (!db.hasDb()) {
    return res.status(400).json({ message: 'Referrals require DATABASE_URL (Postgres)' });
  }

  const REFERRAL_POINTS = 100;
  try {
    const result = await db.completeReferralWithPoints(code, trimmed, walletVal, REFERRAL_POINTS, {
      hashPassword: (plain) => bcrypt.hash(plain, 10),
      generateId,
    });
    if (result.referrerNotFound) {
      return res.status(400).json({
        message: 'Invalid referrer code. The person who invited you needs to open the app and sign in once so their account is created, then you can try again.',
        code: 'REFERRER_NOT_FOUND',
      });
    }
    if (result.already) {
      return res.status(200).json({ ok: true, message: 'Referral already recorded' });
    }
    return res.status(201).json({ ok: true, message: 'Referral recorded' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid referrer code' });
    }
    if (err.code === '23505') {
      return res.status(200).json({ ok: true, message: 'Referral already recorded' });
    }
    console.error('referrals/complete error', err);
    return res.status(500).json({ message: 'Failed to record referral' });
  }
});

// ----- Admin: list users (requires Postgres + ADMIN_API_KEY) -----
app.get('/admin/users', adminMiddleware, async (req, res) => {
  if (!db.hasDb()) {
    return res.status(400).json({ message: 'User list requires DATABASE_URL (Postgres)' });
  }
  try {
    const users = await db.listUsers();
    return res.json({ users });
  } catch (err) {
    console.error('admin users error', err);
    const code = err?.code || '';
    const msg = code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT'
      ? 'Database unreachable. Check DATABASE_URL and network (e.g. internet, Supabase host).'
      : 'Failed to list users';
    return res.status(500).json({ message: msg, errorCode: code || undefined });
  }
});

// ----- Admin: grant bonus points to a user (userId or email) -----
app.post('/admin/points', adminMiddleware, async (req, res) => {
  const { userId, email, amount } = req.body || {};
  const points = security.validatePointsAmount(amount);
  if (points == null) {
    return res.status(400).json({ message: 'Positive amount required (max ' + security.MAX_ADMIN_POINTS + ')' });
  }
  if (!db.hasDb()) {
    return res.status(400).json({ message: 'Points require DATABASE_URL (Postgres)' });
  }
  let id = security.validateUserIdLike(userId, security.MAX_USER_ID_LEN);
  if (!id && email) {
    const trimmed = security.validateEmail(email);
    if (trimmed) {
      const u = await db.getUserByEmail(trimmed);
      if (u) id = u.userId;
    }
  }
  if (!id) {
    return res.status(400).json({ message: 'userId or email required' });
  }
  try {
    await db.addBonusPoints(id, points);
    return res.json({ ok: true, message: 'Points granted', userId: id, amount: points });
  } catch (err) {
    console.error('admin points error', err);
    return res.status(500).json({ message: 'Failed to grant points' });
  }
});

// ----- User: get my points (auth). Optional ?streak=&checkIns= to update activity points from app. -----
app.get('/users/me/points', authMiddleware, async (req, res) => {
  if (db.hasDb()) {
    try {
      const streak = req.query.streak;
      const checkIns = req.query.checkIns;
      if (streak !== undefined && checkIns !== undefined) {
        const s = parseInt(streak, 10);
        const c = parseInt(checkIns, 10);
        if (Number.isInteger(s) && Number.isInteger(c) && s >= 0 && c >= 0) {
          await db.setActivityPoints(req.user.userId, s, c);
        }
      }
      const points = await db.getUserPoints(req.user.userId);
      return res.json(points);
    } catch (err) {
      console.error('users/me/points error', err);
      return res.status(500).json({ message: 'Failed to load points' });
    }
  }
  return res.json({ referralPoints: 0, bonusPoints: 0, activityPoints: 0, totalPoints: 0, loginCount: 0 });
});

// ----- User photos (upload + serve). Max 3 MB per image; stored in-memory. -----
app.post('/users/me/photos', authMiddleware, (req, res) => {
  const { dataUrl } = req.body || {};
  const validated = validatePhotoDataUrl(dataUrl);
  if (!validated.ok) {
    return res.status(400).json({ message: validated.message });
  }
  const id = generatePhotoId();
  photoStore.set(id, { dataUrl: validated.dataUrl, userId: req.user.userId });
  return res.status(201).json({ id, url: `/users/me/photos/${id}` });
});

app.get('/users/me/photos/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const entry = photoStore.get(id);
  if (!entry || entry.userId !== req.user.userId) {
    return res.status(404).json({ message: 'Photo not found' });
  }
  const dataUrl = entry.dataUrl;
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return res.status(500).json({ message: 'Invalid stored photo' });
  const base64 = dataUrl.slice(comma + 1);
  const prefix = dataUrl.slice(0, comma);
  const mimeMatch = prefix.match(/^data:([^;]+);/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const buffer = Buffer.from(base64, 'base64');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.send(buffer);
});

// ----- Body logs -----
app.get('/users/me/body-logs', authMiddleware, async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  // Validate date query params: YYYY-MM-DD, max length 10
  const fromStr = typeof from === 'string' && from.length <= 10 ? from : undefined;
  const toStr = typeof to === 'string' && to.length <= 10 ? to : undefined;

  if (db.hasDb()) {
    try {
      const logs = await db.getBodyLogs(req.user.userId, fromStr, toStr);
      return res.json({ logs });
    } catch (err) {
      console.error('body-logs get db error', err);
      return res.status(500).json({ message: 'Failed to load body logs' });
    }
  }

  const list = bodyLogs.get(req.user.userId) || [];
  let out = list;
  if (fromStr) out = out.filter((l) => l.date >= fromStr);
  if (toStr) out = out.filter((l) => l.date <= toStr);
  return res.json({ logs: out });
});

app.post('/users/me/body-logs', authMiddleware, async (req, res) => {
  const raw = req.body || {};
  const payload = security.sanitizeBodyLogPayload(raw);
  const payloadStr = JSON.stringify(payload);
  if (Buffer.byteLength(payloadStr, 'utf8') > security.MAX_BODY_LOG_PAYLOAD_BYTES) {
    return res.status(413).json({ message: 'Payload too large' });
  }
  const log = {
    id: generateId(),
    date: new Date().toISOString().slice(0, 10),
    userId: req.user.userId,
    ...payload,
  };

  if (db.hasDb()) {
    try {
      await db.createBodyLog(log);
      return res.status(201).json(log);
    } catch (err) {
      console.error('body-logs post db error', err);
      return res.status(500).json({ message: 'Failed to save body log' });
    }
  }

  if (!bodyLogs.has(req.user.userId)) bodyLogs.set(req.user.userId, []);
  bodyLogs.get(req.user.userId).unshift(log);
  return res.status(201).json(log);
});

// ----- Work routine check-ins -----
app.get('/users/me/check-ins', authMiddleware, async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const fromStr = typeof from === 'string' && from.length <= 10 ? from : undefined;
  const toStr = typeof to === 'string' && to.length <= 10 ? to : undefined;

  if (db.hasDb()) {
    try {
      const entries = await db.getCheckIns(req.user.userId, fromStr, toStr);
      return res.json({ checkIns: entries });
    } catch (err) {
      console.error('check-ins get db error', err);
      return res.status(500).json({ message: 'Failed to load check-ins' });
    }
  }

  let list = checkIns.get(req.user.userId) || [];
  if (fromStr) list = list.filter((e) => (e.timestamp || '').slice(0, 10) >= fromStr);
  if (toStr) list = list.filter((e) => (e.timestamp || '').slice(0, 10) <= toStr);
  list = [...list].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  return res.json({ checkIns: list });
});

app.post('/users/me/check-ins', authMiddleware, (req, res) => {
  const raw = req.body || {};
  const payload = security.sanitizeCheckInPayload(raw);
  if (!payload) {
    return res.status(400).json({ message: 'Invalid check-in payload or too large' });
  }
  const entry = { ...payload, userId: req.user.userId };

  if (db.hasDb()) {
    db.createCheckIn(entry)
      .then(() => res.status(201).json(entry))
      .catch((err) => {
        if (err.code === '23505') return res.status(201).json(entry); // duplicate id, idempotent
        console.error('check-ins post db error', err);
        return res.status(500).json({ message: 'Failed to save check-in' });
      });
    return;
  }

  if (!checkIns.has(req.user.userId)) checkIns.set(req.user.userId, []);
  checkIns.get(req.user.userId).unshift(entry);
  return res.status(201).json(entry);
});

// ----- Insights (note-aware, with factors) -----
const { computeInsights } = require('./insights/bodySignals');

app.post('/insights/body-signals', (req, res) => {
  if (!security.isBodyWithinLimit(req, security.MAX_INSIGHTS_BODY_BYTES)) {
    return res.status(413).json({ message: 'Request too large' });
  }
  try {
    const payload = req.body || {};
    const { insight, explanation, improvements, factors } = computeInsights(payload);
    return res.json({ insight, explanation, improvements, factors: factors || [] });
  } catch (err) {
    console.error('insights/body-signals error', err);
    return res.status(500).json({ message: 'Insights failed' });
  }
});

// ----- Premium (stub) -----
app.get('/premium/status', (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.json({ isPremium: false });
  return res.json({ isPremium: false });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/health/db', async (req, res) => {
  const result = await db.ping();
  res.status(result.ok ? 200 : 503).json(result);
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Pulse API listening on port ${PORT}${db.hasDb() ? ' (Postgres)' : ' (in-memory)'}`);
  });
}
