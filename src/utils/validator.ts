import type { Board } from './types';
import { idx } from './types';

export function isValidPlacement(board: Board, row: number, col: number, num: number): boolean {
  if (num < 1 || num > 9) return false;
  for (let i = 0; i < 9; i++) {
    if (board[idx(row, i)] === num && i !== col) return false;
    if (board[idx(i, col)] === num && i !== row) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[idx(r, c)] === num && (r !== row || c !== col)) return false;
    }
  }
  return true;
}

export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[idx(r, c)];
      if (!v) continue;
      if (!isValidPlacement(board, r, c, v)) {
        conflicts.add(idx(r, c));
      }
    }
  }
  return conflicts;
}

export function isComplete(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (!board[i]) return false;
  }
  return findConflicts(board).size === 0;
}

export function matchesSolution(current: Board, solution: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (current[i] !== solution[i]) return false;
  }
  return true;
}
