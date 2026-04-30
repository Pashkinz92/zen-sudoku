import { useMemo } from 'react';
import type { Board } from '../../utils/types';
import styles from './NumPad.module.css';

export interface NumPadProps {
  current: Board;
  notesMode: boolean;
  canUndo: boolean;
  onDigit: (digit: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
}

export function NumPad({
  current,
  notesMode,
  canUndo,
  onDigit,
  onErase,
  onUndo,
  onToggleNotes,
  onHint,
}: NumPadProps) {
  const counts = useMemo(() => {
    const c = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) c[current[i]]++;
    return c;
  }, [current]);

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last move"
        >
          <span className={styles.actionIcon}>↶</span>
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onErase}
          aria-label="Erase cell"
        >
          <span className={styles.actionIcon}>⌫</span>
          <span>Erase</span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${notesMode ? styles.active : ''}`}
          onClick={onToggleNotes}
          aria-pressed={notesMode}
          aria-label="Toggle notes mode"
        >
          <span className={styles.actionIcon}>✎</span>
          <span>Notes{notesMode ? ' ●' : ''}</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onHint}
          aria-label="Reveal selected cell"
        >
          <span className={styles.actionIcon}>💡</span>
          <span>Hint</span>
        </button>
      </div>
      <div className={styles.digits}>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const exhausted = counts[n] >= 9;
          return (
            <button
              key={n}
              type="button"
              className={`${styles.digit} ${exhausted ? styles.exhausted : ''}`}
              onClick={() => onDigit(n)}
              aria-label={`Enter ${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
