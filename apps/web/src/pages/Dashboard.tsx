import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { recordAppUsage, getAppStreak } from '../stores/appStreak';
import { getBodyLogs } from '../blocks/BodySignals/store';
import { getCheckIns, setCheckInsFromServer } from '../blocks/WorkRoutine/store';
import { startNotificationChecks, stopNotificationChecks } from '../stores/notifications';
import { BlockCard } from '../components/BlockCard';
import { AppFooter } from '../components/AppFooter';
import { NextStepModal } from '../components/NextStepModal';
import { BLOCKS } from '../blocks/registry';
import styles from './Dashboard.module.css';

const ACTIVE_IDS = ['body-signals', 'work-routine', 'nutrition'];
const COMING_SOON_IDS = ['movement', 'recovery'];

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

type PointsData = {
  referralPoints: number;
  bonusPoints: number;
  activityPoints: number;
  totalPoints: number;
};

type LocationState = { refreshPoints?: boolean; showSubmitModal?: boolean; modalVariant?: 'nutrition' };

export function Dashboard() {
  const { user, accessToken, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [pointsRefreshKey, setPointsRefreshKey] = useState(0);
  const locationState = location.state as LocationState;
  const showSubmitModal = locationState?.showSubmitModal ?? false;
  const modalVariant = locationState?.modalVariant ?? 'default';

  // Force points refetch when landing from a check-in (so new activity points appear)
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.refreshPoints) {
      setPointsRefreshKey((k) => k + 1);
      const next: LocationState = { ...state, refreshPoints: false };
      window.history.replaceState(next, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  useEffect(() => {
    if (user) recordAppUsage();
  }, [user]);

  useEffect(() => {
    if (user) startNotificationChecks();
    return () => stopNotificationChecks();
  }, [user]);

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
        localOnly.forEach((entry) => {
          fetch(`${API_BASE}/users/me/check-ins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(entry),
          }).catch(() => {});
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken]);

  // Sync body logs to API so they count toward activity points
  useEffect(() => {
    if (!user || !accessToken || !API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/users/me/body-logs`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const server = Array.isArray(data?.logs) ? data.logs : [];
        const serverIds = new Set(server.map((l: { id?: string }) => l.id));
        const local = getBodyLogs();
        const localOnly = local.filter((e) => e.id && !serverIds.has(e.id));
        localOnly.forEach((entry) => {
          fetch(`${API_BASE}/users/me/body-logs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(entry),
          }).catch(() => {});
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken]);

  const streak = getAppStreak();
  const checkInsCount = getBodyLogs().length + getCheckIns().length;

  useEffect(() => {
    const onFocus = () => setPointsRefreshKey((k) => k + 1);
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  useEffect(() => {
    if (!user || !accessToken || !API_BASE) {
      setPoints(null);
      return;
    }
    let cancelled = false;
    const latestCount = getBodyLogs().length + getCheckIns().length;
    const url = `${API_BASE}/users/me/points?streak=${encodeURIComponent(streak)}&checkIns=${encodeURIComponent(latestCount)}`;
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.referralPoints === 'number') {
          setPoints({
            referralPoints: data.referralPoints ?? 0,
            bonusPoints: data.bonusPoints ?? 0,
            activityPoints: data.activityPoints ?? 0,
            totalPoints: data.totalPoints ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken, streak, checkInsCount, pointsRefreshKey]);

  const activeBlocks = BLOCKS.filter((b) => ACTIVE_IDS.includes(b.id));
  const comingSoonBlocks = BLOCKS.filter((b) => COMING_SOON_IDS.includes(b.id));
  const totalPoints = points?.totalPoints ?? 0;
  const referralPoints = points?.referralPoints ?? 0;
  const bonusPoints = points?.bonusPoints ?? 0;
  const activityPoints = points?.activityPoints ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
          <h1 className={styles.logo}>Pulse</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/dashboard/profile" className={styles.profileLink}>
            {user?.email}
          </Link>
          <button type="button" onClick={signOut} className={styles.profileBtn}>
            Sign out
          </button>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroLine1}>No noise.</p>
          <p className={styles.heroLine2}>Just signal.</p>
          <Link to="/dashboard/pulse" className={styles.pulseLink}>
            See your Pulse
          </Link>
        </section>

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
            <span className={styles.breakdownLabel}>Reward points (admin)</span>
            <span className={styles.breakdownValue}>{bonusPoints}</span>
          </div>
        </section>

        <section className={styles.section}>
          {activeBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              href={block.route ? `/dashboard/${block.id}` : undefined}
            />
          ))}
        </section>

        <section className={styles.comingSoon}>
          <h2 className={styles.comingSoonLabel}>COMING SOON</h2>
          {comingSoonBlocks.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </section>

        <AppFooter />
      </main>
      <NextStepModal
        isOpen={showSubmitModal}
        onDashboard
        variant={modalVariant === 'nutrition' ? 'nutrition' : 'default'}
        onClose={() => navigate(location.pathname, { replace: true, state: {} })}
      />
    </div>
  );
}
