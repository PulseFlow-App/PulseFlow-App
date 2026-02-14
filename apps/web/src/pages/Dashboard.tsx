import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { recordAppUsage, getAppStreak } from '../stores/appStreak';
import { getBodyLogs } from '../blocks/BodySignals/store';
import { getCheckIns } from '../blocks/WorkRoutine/store';
import { startNotificationChecks } from '../stores/notifications';
import { BlockCard } from '../components/BlockCard';
import { AppFooter } from '../components/AppFooter';
import { BLOCKS } from '../blocks/registry';
import styles from './Dashboard.module.css';

const ACTIVE_IDS = ['body-signals', 'work-routine', 'nutrition'];
const COMING_SOON_IDS = ['movement', 'recovery'];

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

type PointsData = {
  referralPoints: number;
  bonusPoints: number;
  totalPoints: number;
};

export function Dashboard() {
  const { user, accessToken, signOut } = useAuth();
  const [points, setPoints] = useState<PointsData | null>(null);

  useEffect(() => {
    if (user) recordAppUsage();
  }, [user]);

  useEffect(() => {
    if (user) startNotificationChecks();
  }, [user]);

  useEffect(() => {
    if (!user || !accessToken || !API_BASE) {
      setPoints(null);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/users/me/points`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.referralPoints === 'number') {
          setPoints({
            referralPoints: data.referralPoints ?? 0,
            bonusPoints: data.bonusPoints ?? 0,
            totalPoints: data.totalPoints ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, accessToken]);

  const streak = getAppStreak();
  const checkInsCount = getBodyLogs().length + getCheckIns().length;
  const activeBlocks = BLOCKS.filter((b) => ACTIVE_IDS.includes(b.id));
  const comingSoonBlocks = BLOCKS.filter((b) => COMING_SOON_IDS.includes(b.id));
  const totalPoints = points?.totalPoints ?? 0;
  const referralPoints = points?.referralPoints ?? 0;
  const bonusPoints = points?.bonusPoints ?? 0;

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
            <Link to={user ? '/dashboard/invite' : '/invite'} className={styles.statLink}>
              Invite friends
            </Link>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{totalPoints}</span>
            <span className={styles.statLabel}>Total points</span>
          </div>
        </section>

        <section className={styles.pointsBreakdown} aria-label="Points breakdown">
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
    </div>
  );
}
