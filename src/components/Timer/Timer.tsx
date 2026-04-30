import { formatTime } from '../../hooks/useTimer';
import styles from './Timer.module.css';

export function Timer({ ms }: { ms: number }) {
  return (
    <div className={styles.timer} aria-label="Timer">
      <span className={styles.dot} />
      <span>{formatTime(ms)}</span>
    </div>
  );
}
