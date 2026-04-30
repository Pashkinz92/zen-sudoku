export type Difficulty = 'easy' | 'medium' | 'hard';

export type Board = number[]; // 81 cells, row-major; 0 = empty

export interface CellNotes {
  [index: number]: number[]; // candidate digits per cell index
}

export interface GameState {
  puzzle: Board;       // original clues (immutable)
  solution: Board;     // full solution
  current: Board;      // user's current entries
  notes: CellNotes;    // pencil marks
  difficulty: Difficulty;
  elapsedMs: number;
  startedAt: number;   // timestamp when last (re)started/resumed
  finished: boolean;
  hintsUsed: number;
  mistakes: number;
}

export interface Stats {
  bestTimes: { easy?: number; medium?: number; hard?: number };
  played: { easy: number; medium: number; hard: number };
  won: { easy: number; medium: number; hard: number };
}

export const EMPTY_STATS: Stats = {
  bestTimes: {},
  played: { easy: 0, medium: 0, hard: 0 },
  won: { easy: 0, medium: 0, hard: 0 },
};

export const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 24,
};

export const idx = (r: number, c: number) => r * 9 + c;
export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
