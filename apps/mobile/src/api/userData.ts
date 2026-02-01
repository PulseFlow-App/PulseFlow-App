/**
 * User data API - sync body logs and routine check-ins to backend (per user).
 * All requests use Authorization: Bearer <token>. Data stored securely per userId.
 * Callers pass token from useAuth().getAccessToken(). When EXPO_PUBLIC_API_URL is not set, no-op.
 */
import type { BodyLogEntry } from '../blocks/BodySignals/types';

function getApiUrl(): string | undefined {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '')
    : undefined;
}

async function authFetch(
  path: string,
  token: string | null | undefined,
  options: RequestInit
): Promise<Response> {
  const base = getApiUrl();
  if (!base) return new Response(null, { status: 204 });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${base}${path}`, { ...options, headers });
}

/** Sync a body log to the backend. Call after addBodyLog when user is signed in (pass token from useAuth().getAccessToken()). */
export async function syncBodyLog(
  entry: Omit<BodyLogEntry, 'id' | 'date'>,
  token: string | null | undefined
): Promise<boolean> {
  const res = await authFetch('/users/me/body-logs', token, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  return res.ok;
}

/** Fetch body logs for range. Pass token from useAuth().getAccessToken(). */
export async function fetchBodyLogs(
  from: string,
  to: string,
  token: string | null | undefined
): Promise<BodyLogEntry[]> {
  const res = await authFetch(
    `/users/me/body-logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    token
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { logs?: BodyLogEntry[] };
  return data.logs ?? [];
}

// Work routine check-ins: same pattern - POST /users/me/work-check-ins, GET /users/me/work-check-ins
// Baselines: GET /users/me/baselines when building AI or Pulse (backend computes from logs).
