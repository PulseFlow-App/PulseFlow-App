import { Icon } from '@iconify/react';
import type { Block } from '../blocks/registry';
import styles from './BlockIcon.module.css';

type Props = {
  block: Block;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function BlockIcon({ block, size = 'md' }: Props) {
  return (
    <span
      className={`${styles.icon} ${sizeClass[size]}`}
      style={{ color: block.color }}
      aria-hidden
    >
      <Icon icon={block.icon} />
    </span>
  );
}
