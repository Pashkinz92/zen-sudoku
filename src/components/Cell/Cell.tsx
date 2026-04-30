import { memo, useEffect, useRef } from 'react';
import styles from './Cell.module.css';

export interface CellProps {
  index: number;
  value: number;
  isClue: boolean;
  notes: number[];
  selected: boolean;
  peer: boolean;
  sameValue: boolean;
  error: boolean;
  onSelect: (index: number) => void;
}

function CellImpl({
  index,
  value,
  isClue,
  notes,
  selected,
  peer,
  sameValue,
  error,
  onSelect,
}: CellProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const lastValueRef = useRef(value);

  // Trigger pop animation only when value transitions to a non-zero number.
  useEffect(() => {
    if (!ref.current) return;
    if (lastValueRef.current !== value && value !== 0) {
      ref.current.classList.remove(styles.placed);
      void ref.current.offsetWidth;
      ref.current.classList.add(styles.placed);
    }
    lastValueRef.current = value;
  }, [value]);

  const className = [
    styles.cell,
    isClue ? styles.clue : '',
    selected ? styles.selected : '',
    peer && !selected ? styles.peer : '',
    sameValue && !selected ? styles.sameValue : '',
    error ? styles.error : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onPointerDown={(e) => {
        e.preventDefault();
        onSelect(index);
      }}
      aria-label={`Cell ${Math.floor(index / 9) + 1},${(index % 9) + 1}${value ? `, ${value}` : ', empty'}`}
    >
      {value ? (
        value
      ) : notes.length > 0 ? (
        <div className={styles.notes}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span key={n} className={styles.note}>
              {notes.includes(n) ? n : ''}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export const Cell = memo(CellImpl);
