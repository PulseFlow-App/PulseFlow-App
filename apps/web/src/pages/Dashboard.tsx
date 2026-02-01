import { useAuth } from '../contexts/AuthContext';
import { BlockCard } from '../components/BlockCard';
import { BLOCKS } from '../blocks/registry';
import styles from './Dashboard.module.css';

const ACTIVE_IDS = ['body-signals', 'work-routine'];
const COMING_SOON_IDS = ['nutrition', 'movement', 'recovery'];

export function Dashboard() {
  const { user, signOut } = useAuth();
  const activeBlocks = BLOCKS.filter((b) => ACTIVE_IDS.includes(b.id));
  const comingSoonBlocks = BLOCKS.filter((b) => COMING_SOON_IDS.includes(b.id));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Pulse</h1>
        <nav className={styles.nav}>
          <span className={styles.email}>{user?.email}</span>
          <button type="button" onClick={signOut} className={styles.profileBtn}>
            Sign out
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroLine1}>No noise.</p>
          <p className={styles.heroLine2}>Just signal.</p>
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

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            Powered by Pulse. Body Signals and Work Routine blocks; more coming soon.
          </p>
        </footer>
      </main>
    </div>
  );
}
