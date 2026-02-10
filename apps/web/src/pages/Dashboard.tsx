import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { recordAppUsage, getAppStreak } from '../stores/appStreak';
import { getCheckIns } from '../blocks/WorkRoutine/store';
import { startNotificationChecks } from '../stores/notifications';
import { BlockCard } from '../components/BlockCard';
import { AppFooter } from '../components/AppFooter';
import { BLOCKS } from '../blocks/registry';
import styles from './Dashboard.module.css';

const ACTIVE_IDS = ['body-signals', 'work-routine'];
const COMING_SOON_IDS = ['nutrition', 'movement', 'recovery'];

export function Dashboard() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) recordAppUsage();
  }, [user]);

  useEffect(() => {
    if (user) startNotificationChecks();
  }, [user]);

  const streak = getAppStreak();
  const checkInsCount = getCheckIns().length;
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
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>Points</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statMuted}>Leaderboard</span>
            <span className={styles.statLabel}>Coming soon</span>
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
