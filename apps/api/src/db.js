/**
 * Postgres DB layer for Pulse API.
 * When DATABASE_URL is set, uses pg Pool; otherwise the API uses in-memory storage.
 */
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
// Default: accept Supabase/pooler certs (avoids SELF_SIGNED_CERT_IN_CHAIN on Vercel). Set DATABASE_SSL_REJECT_UNAUTHORIZED=true for strict verification.
const sslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' || process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === '1';
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: sslRejectUnauthorized },
    })
  : null;

function hasDb() {
  return pool !== null;
}

/** Test DB connectivity (for health check). Returns { ok: true } or { ok: false, error: string }. */
async function ping() {
  if (!pool) return { ok: false, error: 'no_database' };
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.code || e.message };
  }
}

async function getUserByEmail(email) {
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  return rows[0] ? { userId: rows[0].id, email: rows[0].email, passwordHash: rows[0].password_hash } : null;
}

async function createUser(id, email, passwordHash, wallet = null) {
  if (!pool) return null;
  await pool.query(
    'INSERT INTO users (id, email, password_hash, wallet, last_seen_at) VALUES ($1, $2, $3, $4, NOW())',
    [id, email, passwordHash, wallet]
  );
  return { userId: id, email, wallet };
}

/** Update last_seen_at and increment login_count for an existing user (call on each /auth/sync). */
async function updateLastSeen(userId) {
  if (!pool) return;
  await pool.query(
    'UPDATE users SET last_seen_at = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = $1',
    [userId]
  );
}

async function createReferral(referrerUserId, referredEmail, referredWallet = null) {
  if (!pool) return null;
  const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await pool.query(
    'INSERT INTO referrals (id, referrer_user_id, referred_email, referred_wallet, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [id, referrerUserId, referredEmail, referredWallet]
  );
  return { id, referrerUserId, referredEmail, referredWallet };
}

/** Get points and login count for a user. Returns zeros when no DB or user missing. */
async function getUserPoints(userId) {
  if (!pool) return { referralPoints: 0, bonusPoints: 0, totalPoints: 0, loginCount: 0 };
  const { rows } = await pool.query(
    'SELECT COALESCE(referral_points, 0) AS referral_points, COALESCE(bonus_points, 0) AS bonus_points, COALESCE(login_count, 0) AS login_count FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) return { referralPoints: 0, bonusPoints: 0, totalPoints: 0, loginCount: 0 };
  const r = Number(rows[0].referral_points) || 0;
  const b = Number(rows[0].bonus_points) || 0;
  return { referralPoints: r, bonusPoints: b, totalPoints: r + b, loginCount: Number(rows[0].login_count) || 0 };
}

/** Add referral points to the referrer (after a referral is completed). */
async function addReferralPoints(userId, amount) {
  if (!pool || !userId || amount <= 0) return;
  await pool.query(
    'UPDATE users SET referral_points = COALESCE(referral_points, 0) + $1 WHERE id = $2',
    [amount, userId]
  );
}

/** Add bonus points (admin manual distribution). */
async function addBonusPoints(userId, amount) {
  if (!pool || !userId || amount <= 0) return;
  await pool.query(
    'UPDATE users SET bonus_points = COALESCE(bonus_points, 0) + $1 WHERE id = $2',
    [amount, userId]
  );
}

async function getBodyLogs(userId, from, to) {
  if (!pool) return [];
  let query = 'SELECT id, user_id AS "userId", date, payload, created_at AS "createdAt" FROM body_logs WHERE user_id = $1';
  const params = [userId];
  if (from) {
    params.push(from);
    query += ` AND date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    query += ` AND date <= $${params.length}`;
  }
  query += ' ORDER BY date DESC, created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    date: r.date,
    ...r.payload,
    createdAt: r.createdAt,
  }));
}

async function createBodyLog(log) {
  if (!pool) return null;
  const { id, userId, date, ...payload } = log;
  await pool.query(
    'INSERT INTO body_logs (id, user_id, date, payload) VALUES ($1, $2, $3, $4)',
    [id, userId, date, JSON.stringify(payload)]
  );
  return log;
}

/** List all users (id, email, created_at, last_seen_at, points, login_count). For admin/export. */
async function listUsers() {
  if (!pool) return [];
  const { rows } = await pool.query(
    'SELECT id, email, created_at AS "createdAt", last_seen_at AS "lastSeenAt", COALESCE(referral_points, 0) AS "referralPoints", COALESCE(bonus_points, 0) AS "bonusPoints", COALESCE(login_count, 0) AS "loginCount" FROM users ORDER BY created_at DESC'
  );
  return rows;
}

module.exports = {
  hasDb,
  ping,
  getUserByEmail,
  createUser,
  createReferral,
  updateLastSeen,
  getUserPoints,
  addReferralPoints,
  addBonusPoints,
  getBodyLogs,
  createBodyLog,
  listUsers,
};
