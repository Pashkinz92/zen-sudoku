import type { Difficulty, Stats } from '../../utils/types';
import { formatTime } from '../../hooks/useTimer';
import styles from './StatsScreen.module.css';

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export interface StatsScreenProps {
  stats: Stats;
  onBack: () => void;
}

export function StatsScreen({ stats, onBack }: StatsScreenProps) {
  const totalPlayed = stats.played.easy + stats.played.medium + stats.played.hard;
  const totalWon = stats.won.easy + stats.won.medium + stats.won.hard;
  const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  return (
    <div className={`${styles.wrap} fade-in`}>
      <div className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1 className={styles.title}>Your progress</h1>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Summary</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summary}>
            <div className={styles.summaryValue}>{totalPlayed}</div>
            <div className={styles.summaryLabel}>Played</div>
          </div>
          <div className={styles.summary}>
            <div className={styles.summaryValue}>{totalWon}</div>
            <div className={styles.summaryLabel}>Won</div>
          </div>
          <div className={styles.summary}>
            <div className={styles.summaryValue}>{winRate}%</div>
            <div className={styles.summaryLabel}>Win rate</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Best times</h2>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <div key={d} className={styles.row}>
            <span className={styles.rowLabel}>{LABELS[d]}</span>
            <span className={styles.rowValue}>
              {stats.bestTimes[d] !== undefined ? formatTime(stats.bestTimes[d]!) : '—'}
            </span>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>By difficulty</h2>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <div key={d} className={styles.row}>
            <span className={styles.rowLabel}>{LABELS[d]}</span>
            <span className={styles.rowValue}>
              {stats.won[d]} / {stats.played[d]}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
