import { Link } from 'react-router-dom';
import type { Block } from '../blocks/registry';
import { BlockIcon } from './BlockIcon';
import styles from './BlockCard.module.css';

type Props = {
  block: Block;
  href?: string;
};

export function BlockCard({ block, href }: Props) {
  const content = (
    <>
      <BlockIcon block={block} size="md" />
      <div className={styles.text}>
        <h3 className={styles.name}>{block.name}</h3>
        <p className={styles.desc}>{block.description}</p>
      </div>
      {href && <span className={styles.arrow}>→</span>}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={styles.card}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`${styles.card} ${styles.cardDisabled}`}>
      {content}
    </div>
  );
}
