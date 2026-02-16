#!/usr/bin/env node
/**
 * One-off: grant bonus points to a user by email (for testing).
 *
 * Mode 1 – Direct DB (no API needed): set DATABASE_URL. Loads .env from apps/api when run from repo root.
 *   DATABASE_URL=postgres://... node apps/api/scripts/grant-bonus-points.js lumina.envisions@gmail.com 100
 *   Or from apps/api: node scripts/grant-bonus-points.js lumina.envisions@gmail.com 100
 *
 * Mode 2 – Via API: set API_BASE and ADMIN_API_KEY, and have the API server running.
 *   API_BASE=http://localhost:3000 ADMIN_API_KEY=... node apps/api/scripts/grant-bonus-points.js lumina.envisions@gmail.com 100
 */
const path = require('path');
// Load apps/api/.env when run from repo root (e.g. node apps/api/scripts/...)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const base = process.env.API_BASE || 'http://localhost:3000';
const adminKey = process.env.ADMIN_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
const email = process.argv[2];
const amount = process.argv[3];

if (!email || !amount) {
  console.error('Usage: node scripts/grant-bonus-points.js <email> <amount>');
  console.error('  Set DATABASE_URL for direct DB (no API), or API_BASE + ADMIN_API_KEY for HTTP.');
  process.exit(1);
}

const points = parseInt(amount, 10);
if (!Number.isInteger(points) || points <= 0) {
  console.error('Amount must be a positive integer');
  process.exit(1);
}

const trimmedEmail = email.trim().toLowerCase();

async function runViaDb() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (userRes.rows.length === 0) {
      console.error('No user found with email:', trimmedEmail);
      process.exit(1);
    }
    const userId = userRes.rows[0].id;
    await pool.query(
      'UPDATE users SET bonus_points = COALESCE(bonus_points, 0) + $1 WHERE id = $2',
      [points, userId]
    );
    console.log('OK: Points granted userId:', userId, 'amount:', points);
  } catch (err) {
    if (err.code === '28P01') {
      console.error('Database login failed: wrong user or password in DATABASE_URL.');
      console.error('Update apps/api/.env with the correct Postgres URL (e.g. from Supabase/Neon dashboard).');
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
  let res;
  try {
    res = await fetch(`${base.replace(/\/$/, '')}/admin/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({ email: trimmedEmail, amount: points }),
    });
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED') {
      console.error('Cannot reach the API (connection refused). Start the API first in another terminal:');
      console.error('  cd apps/api && npm start');
      console.error('Then run this command again.');
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Error:', res.status, data.message || data);
    process.exit(1);
  }
  console.log('OK:', data.message, 'userId:', data.userId, 'amount:', data.amount);
}

async function run() {
  // Prefer API when ADMIN_API_KEY is set (Option B); otherwise use direct DB if DATABASE_URL set.
  if (adminKey) {
    await runViaApi();
  } else if (databaseUrl) {
    await runViaDb();
  } else {
    console.error('Set ADMIN_API_KEY (and start API) or DATABASE_URL for direct DB.');
    process.exit(1);
  }
}

run();
