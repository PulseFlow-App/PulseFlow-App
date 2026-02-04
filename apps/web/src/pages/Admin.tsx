import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';
import adminStyles from './Admin.module.css';

const API_BASE =
  typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.trim()
    ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
    : '';

type UserRow = { id: string; email: string; createdAt: string };

export function Admin() {
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_BASE) {
      setError('VITE_API_URL is not set. Configure it in the PWA project to use the admin cabinet.');
      return;
    }
    const key = password.trim();
    if (!key) {
      setError('Enter the password.');
      return;
    }
    setError(null);
    setUsers(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503) setError('Admin not configured. Set the password on the API.');
        else if (res.status === 401) setError('Invalid password.');
        else if (res.status === 400) setError(data?.message || 'User list requires Postgres (DATABASE_URL).');
        else setError(data?.message || `Error ${res.status}.`);
        return;
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      const isConnectionRefused = /failed to fetch|network error|connection refused|err_connection_refused/i.test(msg) || (err && typeof err === 'object' && 'message' in err && String((err as Error).message).toLowerCase().includes('fetch'));
      setError(isConnectionRefused
        ? "Can't reach the API. If testing locally, start it: cd apps/api && npm run dev"
        : msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Admin cabinet</h1>
        <p className={adminStyles.updated}>
          Enter the password.
        </p>

        {!API_BASE && (
          <p className={adminStyles.noApi}>
            Set <strong>VITE_API_URL</strong> in the PWA project (e.g. in Vercel) to your API base URL, then redeploy. The admin cabinet uses it to call <code>GET /admin/users</code>.
          </p>
        )}

        <form onSubmit={loadUsers} className={adminStyles.form}>
          <label className={adminStyles.label} htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className={adminStyles.input}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter password"
            autoComplete="off"
            disabled={!API_BASE}
          />
          <button type="submit" className={adminStyles.button} disabled={loading || !API_BASE}>
            {loading ? 'Loading…' : 'Load users'}
          </button>
        </form>

        {error && <p className={adminStyles.error} role="alert">{error}</p>}

        {users && (
          <>
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>User ID</th>
                    <th>Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td><code>{u.id}</code></td>
                      <td>{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={adminStyles.count}>{users.length} user{users.length !== 1 ? 's' : ''}</p>
          </>
        )}
      </main>
    </div>
  );
}
