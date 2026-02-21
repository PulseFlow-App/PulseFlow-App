/**
 * Wallet-gated Dashboard: all user activity and points.
 * When wallet is not connected, shows connect prompt. When connected, shows stats and points breakdown.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { getAppStreak } from '../stores/appStreak';
import { getBodyLogs } from '../blocks/BodySignals/store';
import { getCheckIns, setCheckInsFromServer } from '../blocks/WorkRoutine/store';
import { WalletDropdown } from '../components/WalletDropdown';
import { AppFooter } from '../components/AppFooter';
import styles from './Dashboard.module.css';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

type PointsData = {
  referralPoints: number;
  bonusPoints: number;
  activityPoints: number;
  totalPoints: number;
  checkIns?: number;
};

export function DashboardActivity() {
  const { user, accessToken, signOut } = useAuth();
  const { walletPublicKey } = useWallet();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [howToEarnOpen, setHowToEarnOpen] = useState(false);

  useEffect(() => {
    if (!user || !accessToken || !API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/users/me/check-ins`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const server = Array.isArray(data?.checkIns) ? data.checkIns : [];
        const serverIds = new Set(server.map((e: { id?: string }) => e.id));
        const local = getCheckIns();
        const localOnly = local.filter((e) => e.id && !serverIds.has(e.id));
        const merged = [...server, ...localOnly].sort(
          (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
        );
        setCheckInsFromServer(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken]);

  const streak = getAppStreak();
  const localCheckIns = getBodyLogs().length + getCheckIns().length;

  useEffect(() => {
    if (!user || !accessToken || !API_BASE) {
      setPoints(null);
      return;
    }
    let cancelled = false;
    const url = `${API_BASE}/users/me/points?streak=${encodeURIComponent(streak)}&checkIns=${encodeURIComponent(localCheckIns)}`;
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.referralPoints === 'number') {
          setPoints({
            referralPoints: data.referralPoints ?? 0,
            bonusPoints: data.bonusPoints ?? 0,
            activityPoints: data.activityPoints ?? 0,
            totalPoints: data.totalPoints ?? 0,
            checkIns: typeof data.checkIns === 'number' ? data.checkIns : undefined,
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken, streak, localCheckIns, refreshKey]);

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  const checkInsCount = typeof points?.checkIns === 'number' ? points.checkIns : localCheckIns;
  const totalPoints = points?.totalPoints ?? 0;
  const referralPoints = points?.referralPoints ?? 0;
  const bonusPoints = points?.bonusPoints ?? 0;
  const activityPoints = points?.activityPoints ?? 0;

  // Wallet gate: show connect prompt only on this page
  if (!walletPublicKey) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
            <h1 className={styles.logo}>Pulse</h1>
          </div>
          <nav className={styles.nav}>
            <WalletDropdown className={styles.headerWallet} />
            <Link to="/dashboard/profile" className={`${styles.profileLink} ${styles.navProfile}`}>
              {user?.email}
            </Link>
            <button type="button" onClick={signOut} className={`${styles.profileBtn} ${styles.navSignOut}`}>
              Sign out
            </button>
          </nav>
        </header>
        <main id="main" className={styles.main}>
          <Link to="/dashboard" className={styles.pulseLink} style={{ display: 'inline-block', marginBottom: 24 }}>
            ← Back to home
          </Link>
          <section className={styles.walletRecommend} aria-label="Connect wallet">
            <div className={styles.walletRecommendCard}>
              <p className={styles.walletRecommendTitle}>Connect your wallet to see your dashboard</p>
              <p className={styles.walletRecommendText}>
                Your dashboard, points, check-ins, and on-chain rewards are available once you connect a Solana wallet (Phantom, Solflare, or any compatible wallet).
              </p>
              <WalletDropdown />
            </div>
          </section>
          <AppFooter />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
          <h1 className={styles.logo}>Pulse</h1>
        </div>
        <nav className={styles.nav}>
          <WalletDropdown className={styles.headerWallet} />
          <Link to="/dashboard/profile" className={`${styles.profileLink} ${styles.navProfile}`}>
            {user?.email}
          </Link>
          <button type="button" onClick={signOut} className={`${styles.profileBtn} ${styles.navSignOut}`}>
            Sign out
          </button>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <Link to="/dashboard" className={styles.pulseLink} style={{ display: 'inline-block', marginBottom: 24 }}>
          ← Back to home
        </Link>

        <h2 className={styles.activityTitle}>Your dashboard</h2>

        <section className={styles.statsStrip} aria-label="Your stats">
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{streak}</span>
            <span className={styles.statLabel}>Day streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{checkInsCount}</span>
            <span className={styles.statLabel}>Check-ins</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{totalPoints}</span>
            <span className={styles.statLabel}>Total points</span>
          </div>
        </section>

        <div className={styles.inviteRow}>
          <Link to={user ? '/dashboard/invite' : '/invite'} className={styles.inviteLink}>
            Invite friends
          </Link>
        </div>

        <section className={styles.pointsBreakdown} aria-label="Points breakdown">
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Points earned</span>
            <span className={styles.breakdownValue}>{activityPoints}</span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Referral points</span>
            <span className={styles.breakdownValue}>{referralPoints}</span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Other Rewards</span>
            <span className={styles.breakdownValue}>{bonusPoints}</span>
          </div>
          <div className={styles.howToEarnWrap}>
            <button
              type="button"
              className={styles.howToEarnTrigger}
              onClick={() => setHowToEarnOpen((v) => !v)}
              aria-expanded={howToEarnOpen}
              aria-controls="how-to-earn-content-activity"
              id="how-to-earn-label-activity"
            >
              <span>How to earn</span>
              <span className={styles.howToEarnChevron} aria-hidden>
                {howToEarnOpen ? '▲' : '▼'}
              </span>
            </button>
            <div
              id="how-to-earn-content-activity"
              role="region"
              aria-labelledby="how-to-earn-label-activity"
              className={styles.howToEarnContent}
              hidden={!howToEarnOpen}
            >
              <ul className={styles.howToEarnList}>
                <li><strong>Day streak</strong> — 10 points per day you keep your streak.</li>
                <li><strong>Check-ins & body logs</strong> — 30 points each (work routine check-ins and body signals).</li>
                <li><strong>Logins</strong> — 1 point per login, up to 100 total.</li>
                <li><strong>Referrals</strong> — 100 points when someone signs up using your invite link.</li>
                <li><strong>Other Rewards</strong> — for activity or community contributions (granted by the team).</li>
              </ul>
            </div>
          </div>
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
