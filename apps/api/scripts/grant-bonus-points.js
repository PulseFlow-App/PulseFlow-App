#!/usr/bin/env node
/**
 * One-off: grant bonus points to a user by email or wallet address.
 *
 * Mode 1 – Direct DB (no API needed): set DATABASE_URL.
 *   node apps/api/scripts/grant-bonus-points.js lumina.envisions@gmail.com 100
 *   node apps/api/scripts/grant-bonus-points.js 9W43BrCfv9rK7Q9Tw3mdfdxsBAmurDumGrQMakAaKpN8 20
 *
 * Mode 2 – Via API: set API_BASE and ADMIN_API_KEY, and have the API server running.
 *   API_BASE=http://localhost:3000 ADMIN_API_KEY=... node apps/api/scripts/grant-bonus-points.js <email|wallet> <amount>
 */
const path = require('path');
// Load apps/api/.env (script-relative and cwd so it works from repo root or apps/api)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  if (process.cwd() !== path.dirname(path.join(__dirname, '..'))) {
    require('dotenv').config({ path: path.join(process.cwd(), '.env') });
  }
} catch (_) {}

const base = process.env.API_BASE || 'http://localhost:3000';
const adminKey = process.env.ADMIN_API_KEY;

function buildDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  const pass = process.env.DATABASE_PASSWORD;
  if (!url || typeof url !== 'string') return null;
  url = url.trim();
  if (pass != null && String(pass).trim() !== '') {
    try {
      const u = new URL(url.replace(/^postgres(ql)?:\/\//, 'https://'));
      const encoded = encodeURIComponent(String(pass).trim());
      const auth = u.username ? `${u.username}:${encoded}` : encoded;
      return `postgresql://${auth}@${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname || '/postgres'}${u.search || ''}`;
    } catch (_) {
      return url;
    }
  }
  return url;
}

let databaseUrl = buildDatabaseUrl();
const identifier = process.argv[2]; // email or wallet address
const amount = process.argv[3];

if (!identifier || !amount) {
  console.error('Usage: node scripts/grant-bonus-points.js <email|wallet> <amount>');
  console.error('  Set DATABASE_URL for direct DB (no API), or API_BASE + ADMIN_API_KEY for HTTP.');
  process.exit(1);
}

const points = parseInt(amount, 10);
if (!Number.isInteger(points) || points <= 0) {
  console.error('Amount must be a positive integer');
  process.exit(1);
}

const isEmail = identifier.includes('@');
const trimmedEmail = isEmail ? identifier.trim().toLowerCase() : null;
const wallet = isEmail ? null : identifier.trim();

async function runViaDb() {
  const { Pool } = require('pg');
  let url = databaseUrl;
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:\/\//, 'https://'));
    console.error('DB: connecting to', parsed.hostname + ':' + (parsed.port || '5432'), '(user:', (parsed.username || '?') + ')');
  } catch (_) {}
  const pool = new Pool({ connectionString: url });
  try {
    const byEmail = isEmail;
    let userRes = byEmail
      ? await pool.query('SELECT id FROM users WHERE email = $1', [trimmedEmail])
      : await pool.query('SELECT id FROM users WHERE wallet = $1', [wallet]);
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else if (!byEmail && wallet) {
      userId = `wallet_${wallet.slice(0, 12)}_${Date.now().toString(36)}`;
      const placeholderEmail = `wallet.${wallet.slice(0, 8)}.${Date.now()}@pulse.local`;
      await pool.query(
        'INSERT INTO users (id, email, password_hash, wallet, last_seen_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, placeholderEmail, 'wallet-only', wallet]
      );
      console.error('Created wallet-only user:', userId);
    } else {
      console.error('No user found with', byEmail ? 'email:' : 'wallet:', byEmail ? trimmedEmail : wallet);
      process.exit(1);
    }
    await pool.query(
      'UPDATE users SET bonus_points = COALESCE(bonus_points, 0) + $1 WHERE id = $2',
      [points, userId]
    );
    console.log('OK: Points granted userId:', userId, 'amount:', points);
  } catch (err) {
    if (err.code === '28P01') {
      console.error('Database login failed: wrong user or password.');
      console.error('Option A: In apps/api/.env set DATABASE_PASSWORD=your_actual_password (same line as DATABASE_URL with user but no password, e.g. postgresql://user@host:5432/postgres). Password can contain any characters.');
      console.error('Option B: Reset password in Supabase (Project Settings → Database) to letters/numbers only, then put it in DATABASE_URL=postgresql://user:NEW_PASS@host:5432/postgres');
    } else if (err.code === 'ENOTFOUND' || err.cause?.code === 'ENOTFOUND') {
      console.error('Cannot reach database host (DNS failed). Check DATABASE_URL in apps/api/.env:');
      console.error('  - Copy the exact connection string from Supabase (Project Settings → Database) or Neon.');
      console.error('  - Ensure you have internet and the project is not paused.');
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function runViaApi() {
  const body = isEmail ? { email: trimmedEmail, amount: points } : { wallet, amount: points };
  let res;
  try {
    res = await fetch(`${base.replace(/\/$/, '')}/admin/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED') {
      return false; // caller can fall back to DB
    }
    console.error(err.message || err);
    process.exit(1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Error:', res.status, data.message || data);
    process.exit(1);
  }
  console.log('OK:', data.message, 'userId:', data.userId, 'amount:', data.amount);
  return true;
}

async function run() {
  if (adminKey) {
    const ok = await runViaApi();
    if (!ok && databaseUrl) {
      console.warn('API unreachable; using database directly.');
      await runViaDb();
    } else if (!ok) {
      console.error('Cannot reach the API (connection refused). Start the API or set DATABASE_URL:');
      console.error('  cd apps/api && npm start');
      console.error('  or set DATABASE_URL in apps/api/.env for direct DB.');
      process.exit(1);
    }
  } else if (databaseUrl) {
    await runViaDb();
  } else {
    console.error('Set ADMIN_API_KEY (and start API) or DATABASE_URL for direct DB.');
    process.exit(1);
  }
}

run();
