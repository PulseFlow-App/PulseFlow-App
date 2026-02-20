import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { recordAppUsage } from '../stores/appStreak';
import { getBodyLogs } from '../blocks/BodySignals/store';
import { getCheckIns, setCheckInsFromServer } from '../blocks/WorkRoutine/store';
import { startNotificationChecks, stopNotificationChecks } from '../stores/notifications';
import { getCombinedPulse } from '../stores/combinedPulse';
import { BlockCard } from '../components/BlockCard';
import { AppFooter } from '../components/AppFooter';
import { NextStepModal } from '../components/NextStepModal';
import { WalletDropdown } from '../components/WalletDropdown';
import { ScoreRing } from '../components/ScoreRing';
import { BLOCKS } from '../blocks/registry';
import styles from './Dashboard.module.css';

const ACTIVE_IDS = ['body-signals', 'work-routine', 'nutrition'];
const COMING_SOON_IDS = ['movement', 'recovery'];

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

type LocationState = { refreshPoints?: boolean; showSubmitModal?: boolean; modalVariant?: 'nutrition' };

export function Dashboard() {
  const { user, accessToken, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;
  const showSubmitModal = locationState?.showSubmitModal ?? false;
  const modalVariant = locationState?.modalVariant ?? 'default';

  const pulse = getCombinedPulse();
  const combinedScore = pulse.combined ?? 0;

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

  const activeBlocks = BLOCKS.filter((b) => ACTIVE_IDS.includes(b.id));
  const comingSoonBlocks = BLOCKS.filter((b) => COMING_SOON_IDS.includes(b.id));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
          <h1 className={styles.logo}>Pulse</h1>
        </div>
        <nav className={styles.nav}>
          <WalletDropdown className={styles.headerWallet} />
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
          <div className={styles.heroScoreWrap}>
            <ScoreRing score={combinedScore} label="PULSE" size={120} />
            <Link to="/dashboard/pulse" className={styles.pulseLink}>
              See your Pulse
            </Link>
            <Link to="/dashboard/activity" className={styles.viewDashboardBtn}>
              View Dashboard
            </Link>
          </div>
        </section>

        <div className={styles.inviteRow}>
          <Link to={user ? '/dashboard/invite' : '/invite'} className={styles.inviteLink}>
            Invite friends
          </Link>
        </div>

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
