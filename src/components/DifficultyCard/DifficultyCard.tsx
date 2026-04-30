import type { Difficulty } from '../../utils/types';
import { CLUES_BY_DIFFICULTY } from '../../utils/types';
import styles from './DifficultyCard.module.css';

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export interface DifficultyCardProps {
  difficulty: Difficulty;
  bestTime?: string;
  onSelect: (d: Difficulty) => void;
}

export function DifficultyCard({ difficulty, bestTime, onSelect }: DifficultyCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect(difficulty)}
    >
      <div className={styles.left}>
        <span className={styles.label}>{LABELS[difficulty]}</span>
        <span className={styles.meta}>
          {CLUES_BY_DIFFICULTY[difficulty]} clues{bestTime ? ` · best ${bestTime}` : ''}
        </span>
      </div>
      <span className={`${styles.dot} ${styles[difficulty]}`}>
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
