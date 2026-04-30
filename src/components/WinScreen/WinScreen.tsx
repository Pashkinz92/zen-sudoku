import { useMemo } from 'react';
import type { Difficulty } from '../../utils/types';
import { formatTime } from '../../hooks/useTimer';
import styles from './WinScreen.module.css';

const COLORS = ['#E8A5A5', '#A8C5A0', '#D4CAF0', '#F5E6E6', '#5C5490'];

export interface WinScreenProps {
  difficulty: Difficulty;
  elapsedMs: number;
  hintsUsed: number;
  mistakes: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
}

export function WinScreen({
  difficulty,
  elapsedMs,
  hintsUsed,
  mistakes,
  isNewBest,
  onPlayAgain,
  onChangeDifficulty,
}: WinScreenProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dx: (Math.random() - 0.5) * 80,
        color: COLORS[i % COLORS.length],
      })),
    [],
  );

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.confetti} aria-hidden>
          {pieces.map((p, i) => (
            <span
              key={i}
              style={{
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                ['--dx' as string]: `${p.dx}px`,
              }}
            />
          ))}
        </div>
        <div className={styles.trophy} aria-hidden>🌸</div>
        <h2 className={styles.title}>{isNewBest ? 'New best time!' : 'Beautifully done'}</h2>
        <p className={styles.subtitle}>
          You completed a {difficulty} puzzle.
        </p>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{formatTime(elapsedMs)}</div>
            <div className={styles.statLabel}>Time</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{mistakes}</div>
            <div className={styles.statLabel}>Mistakes</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{hintsUsed}</div>
            <div className={styles.statLabel}>Hints</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onPlayAgain}>
            Play again
          </button>
          <button type="button" className={styles.secondary} onClick={onChangeDifficulty}>
            Change difficulty
          </button>
        </div>
      </div>
    </div>
  );
}
