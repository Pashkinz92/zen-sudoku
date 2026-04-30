import type { Board } from './types';
import { idx } from './types';

function findEmptyMRV(board: Board): { index: number; candidates: number[] } | null {
  let bestIdx = -1;
  let bestCands: number[] = [];
  let bestSize = 10;

  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const used = new Set<number>();
    for (let k = 0; k < 9; k++) {
      used.add(board[idx(r, k)]);
      used.add(board[idx(k, c)]);
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        used.add(board[idx(rr, cc)]);
      }
    }
    const cands: number[] = [];
    for (let n = 1; n <= 9; n++) if (!used.has(n)) cands.push(n);
    if (cands.length < bestSize) {
      bestSize = cands.length;
      bestIdx = i;
      bestCands = cands;
      if (bestSize <= 1) break;
    }
  }
  return bestIdx === -1 ? null : { index: bestIdx, candidates: bestCands };
}

export function solve(board: Board): Board | null {
  const work = board.slice();
  const ok = solveInPlace(work);
  return ok ? work : null;
}

function solveInPlace(board: Board): boolean {
  const next = findEmptyMRV(board);
  if (!next) return true;
  if (next.candidates.length === 0) return false;
  for (const n of next.candidates) {
    board[next.index] = n;
    if (solveInPlace(board)) return true;
  }
  board[next.index] = 0;
  return false;
}

/**
 * Count solutions, stopping early if more than `cap` are found.
 * Used for uniqueness checks during puzzle generation.
 */
export function countSolutions(board: Board, cap = 2): number {
  const work = board.slice();
  let count = 0;
  const recurse = (): void => {
    if (count >= cap) return;
    const next = findEmptyMRV(work);
    if (!next) {
      count++;
      return;
    }
    if (next.candidates.length === 0) return;
    for (const n of next.candidates) {
      work[next.index] = n;
      recurse();
      if (count >= cap) return;
      work[next.index] = 0;
    }
  };
  recurse();
  return count;
}

export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}
