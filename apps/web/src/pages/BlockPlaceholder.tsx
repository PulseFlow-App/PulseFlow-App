import { Link, useParams } from 'react-router-dom';
import { getBlockById } from '../blocks/registry';
import { BlockIcon } from '../components/BlockIcon';
import styles from './BlockPlaceholder.module.css';

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </header>
      <main className={styles.main}>
        <span className={styles.iconWrap}>
          <BlockIcon block={block} size="lg" />
        </span>
        <h1 className={styles.title}>{block.name}</h1>
        <p className={styles.desc}>{block.description}</p>
        <p className={styles.placeholder}>
          This block is not implemented yet on web. Use the mobile app for full features, or add pages here later.
        </p>
      </main>
    </div>
  );
}
