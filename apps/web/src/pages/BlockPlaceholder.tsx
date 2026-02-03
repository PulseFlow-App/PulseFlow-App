import { Link, useParams } from 'react-router-dom';
import { getBlockById } from '../blocks/registry';
import { BlockIcon } from '../components/BlockIcon';
import styles from './BlockPlaceholder.module.css';

const COMING_SOON_IDS = ['nutrition', 'movement', 'recovery'];

export function BlockPlaceholder() {
  const { blockId } = useParams<{ blockId: string }>();
  const block = blockId ? getBlockById(blockId) : null;

  if (!block) {
    return (
      <div className={styles.page}>
        <p className={styles.text}>Block not found.</p>
        <Link to="/dashboard" className={styles.link}>Back to dashboard</Link>
      </div>
    );
  }

  const isComingSoon = COMING_SOON_IDS.includes(block.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </header>
      <main id="main" className={styles.main}>
        <span className={styles.iconWrap}>
          <BlockIcon block={block} size="lg" />
        </span>
        <h1 className={styles.title}>{block.name}</h1>
        <p className={styles.desc}>{block.description}</p>
        <p className={styles.placeholder}>
          {isComingSoon
            ? 'Coming soon. Use the mobile app in the meantime.'
            : 'This block is not available.'}
        </p>
        <Link to="/dashboard" className={styles.link}>Back to dashboard</Link>
      </main>
    </div>
  );
}
