import type { Board, Difficulty } from './types';
import { CLUES_BY_DIFFICULTY, idx } from './types';
import { countSolutions } from './solver';

function shuffled<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fillFullSolution(board: Board): boolean {
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
    const candidates = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n)));
    for (const n of candidates) {
      board[i] = n;
      if (fillFullSolution(board)) return true;
    }
    board[i] = 0;
    return false;
  }
  return true;
}

export function generateSolution(): Board {
  const board: Board = new Array(81).fill(0);
  fillFullSolution(board);
  return board;
}

/**
 * Generate a puzzle with the given difficulty.
 * - Starts from a full solution
 * - Removes cells (in symmetric pairs) while uniqueness is preserved
 * - Stops when target clue count reached or no more removals are safe
 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution = generateSolution();
  const puzzle = solution.slice();
  const targetClues = CLUES_BY_DIFFICULTY[difficulty];

  // Visit cells in random order; remove in symmetric pairs (180° rotation).
  const order = shuffled(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;

  for (const i of order) {
    if (clues <= targetClues) break;
    const mirror = 80 - i;
    if (puzzle[i] === 0) continue;

    const a = puzzle[i];
    const b = puzzle[mirror];
    puzzle[i] = 0;
    if (mirror !== i) puzzle[mirror] = 0;

    if (countSolutions(puzzle, 2) !== 1) {
      // restore
      puzzle[i] = a;
      if (mirror !== i) puzzle[mirror] = b;
    } else {
      clues -= mirror !== i ? 2 : 1;
    }
  }

  return { puzzle, solution };
}
