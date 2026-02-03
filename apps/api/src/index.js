/**
 * Pulse API — minimal backend for auth, body logs, insights, premium.
 * Uses Postgres when DATABASE_URL is set; otherwise in-memory (MVP).
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PORT = process.env.PORT || 3000;

// In-memory fallback when no DATABASE_URL
const users = new Map();
const bodyLogs = new Map();

function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ----- Auth -----
app.post('/auth/sign-up', async (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !password) {
    return res.status(400).json({ message: 'Email and password required' });
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

app.post('/auth/sign-in', async (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !password) {
    return res.status(400).json({ message: 'Email and password required' });
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

// ----- Referrals: complete referral (new user + referral row) -----
app.post('/referrals/complete', async (req, res) => {
  const { referrerCode, email, wallet } = req.body || {};
  const trimmed = (email || '').trim().toLowerCase();
  const code = (referrerCode || '').trim();
  if (!trimmed || !code) {
    return res.status(400).json({ message: 'referrerCode and email required' });
  }

  if (!db.hasDb()) {
    return res.status(400).json({ message: 'Referrals require DATABASE_URL (Postgres)' });
  }

  try {
    const existing = await db.getUserByEmail(trimmed);
    const userId = existing ? existing.userId : generateId();
    if (!existing) {
      const passwordHash = await bcrypt.hash(generateId(), 10);
      await db.createUser(userId, trimmed, passwordHash, wallet || null);
    }
    await db.createReferral(code, trimmed, wallet || null);
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
    return res.status(500).json({ message: 'Failed to list users' });
  }
});

// ----- Body logs -----
app.get('/users/me/body-logs', authMiddleware, async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;

  if (db.hasDb()) {
    try {
      const logs = await db.getBodyLogs(req.user.userId, from, to);
      return res.json({ logs });
    } catch (err) {
      console.error('body-logs get db error', err);
      return res.status(500).json({ message: 'Failed to load body logs' });
    }
  }

  const list = bodyLogs.get(req.user.userId) || [];
  let out = list;
  if (from) out = out.filter((l) => l.date >= from);
  if (to) out = out.filter((l) => l.date <= to);
  return res.json({ logs: out });
});

app.post('/users/me/body-logs', authMiddleware, async (req, res) => {
  const entry = req.body || {};
  const log = {
    id: generateId(),
    date: new Date().toISOString().slice(0, 10),
    userId: req.user.userId,
    ...entry,
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

// ----- Insights (stub) -----
app.post('/insights/body-signals', (req, res) => {
  const { score, trend, frictionPoints } = req.body || {};
  const reasons = (frictionPoints || []).slice(0, 2).join(' and ') || 'your signals';
  const insight = trend === 'down' ? 'Your Pulse Score is lower today; the suggestions below may help.' : 'Focus on one or two of the suggestions below.';
  const explanation = trend === 'down' ? `Your Pulse Score is lower today mainly due to ${reasons}.` : 'Your Pulse Score is steady. The suggestions below may help you nudge it up.';
  const improvements = [
    'Improve sleep consistency — aim for similar bed and wake times.',
    'Increase hydration — small sips throughout the day may help.',
    'Short breaks may help keep energy steady.',
  ].slice(0, 3);
  return res.json({ insight, explanation, improvements });
});

// ----- Premium (stub) -----
app.get('/premium/status', (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.json({ isPremium: false });
  return res.json({ isPremium: false });
});

app.get('/health', (req, res) => res.json({ ok: true }));

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Pulse API listening on port ${PORT}${db.hasDb() ? ' (Postgres)' : ' (in-memory)'}`);
  });
}
