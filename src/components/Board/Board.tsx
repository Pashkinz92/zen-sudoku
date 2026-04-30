import { useMemo } from 'react';
import type { Board as BoardType, CellNotes } from '../../utils/types';
import { boxOf, colOf, rowOf } from '../../utils/types';
import { Cell } from '../Cell/Cell';
import styles from './Board.module.css';

export interface BoardProps {
  puzzle: BoardType;
  current: BoardType;
  notes: CellNotes;
  selected: number | null;
  conflicts: Set<number>;
  onSelectCell: (index: number) => void;
}

export function Board({
  puzzle,
  current,
  notes,
  selected,
  conflicts,
  onSelectCell,
}: BoardProps) {
  const selectedValue = selected !== null ? current[selected] : 0;
  const peers = useMemo(() => {
    if (selected === null) return new Set<number>();
    const r = rowOf(selected);
    const c = colOf(selected);
    const b = boxOf(selected);
    const set = new Set<number>();
    for (let i = 0; i < 81; i++) {
      if (rowOf(i) === r || colOf(i) === c || boxOf(i) === b) set.add(i);
    }
    return set;
  }, [selected]);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} role="grid" aria-label="Sudoku board">
        {Array.from({ length: 81 }, (_, i) => {
          const value = current[i];
          const isClue = puzzle[i] !== 0;
          return (
            <Cell
              key={i}
              index={i}
              value={value}
              isClue={isClue}
              notes={notes[i] ?? []}
              selected={selected === i}
              peer={peers.has(i)}
              sameValue={selectedValue !== 0 && value === selectedValue}
              error={conflicts.has(i)}
              onSelect={onSelectCell}
            />
          );
        })}
      </div>
    </div>
  );
}
