/**
 * Pulse API — minimal backend for auth, body logs, insights, premium.
 * Deploy to Railway, Render, or Fly.io. Set JWT_SECRET and optionally DATABASE_URL.
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PORT = process.env.PORT || 3000;

// In-memory store for MVP (replace with DB)
const users = new Map(); // email -> { userId, email, passwordHash }
const bodyLogs = new Map(); // userId -> array of logs

function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ----- Auth -----
app.post('/auth/sign-up', (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (users.has(trimmed)) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const userId = generateId();
  users.set(trimmed, { userId, email: trimmed, passwordHash: password }); // MVP: store plain; use bcrypt in production
  const accessToken = jwt.sign({ userId, email: trimmed }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: { userId, email: trimmed }, accessToken });
});

app.post('/auth/sign-in', (req, res) => {
  const { email, password } = req.body || {};
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !password) {
    return res.status(400).json({ message: 'Email and password required' });
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

// ----- Body logs -----
app.get('/users/me/body-logs', authMiddleware, (req, res) => {
  const list = bodyLogs.get(req.user.userId) || [];
  const from = req.query.from;
  const to = req.query.to;
  let out = list;
  if (from) out = out.filter((l) => l.date >= from);
  if (to) out = out.filter((l) => l.date <= to);
  return res.json({ logs: out });
});

app.post('/users/me/body-logs', authMiddleware, (req, res) => {
  const entry = req.body || {};
  const log = {
    id: generateId(),
    date: new Date().toISOString().slice(0, 10),
    userId: req.user.userId,
    ...entry,
  };
  if (!bodyLogs.has(req.user.userId)) bodyLogs.set(req.user.userId, []);
  bodyLogs.get(req.user.userId).unshift(log);
  return res.status(201).json(log);
});

// ----- Insights (stub — mobile can use Google AI instead) -----
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

// ----- Premium (stub — implement read-only chain check for $PULSE staking) -----
app.get('/premium/status', (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.json({ isPremium: false });
  // TODO: read Solana/Pump.fun for staked $PULSE; for now stub
  return res.json({ isPremium: false });
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Pulse API listening on port ${PORT}`);
});
