import { useCallback, useEffect, useState } from 'react';
import type { Difficulty, GameState, Stats } from '../utils/types';
import { EMPTY_STATS } from '../utils/types';

const GAME_KEY = 'sudoku.game.v1';
const STATS_KEY = 'sudoku.stats.v1';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadGame(): GameState | null {
  if (typeof localStorage === 'undefined') return null;
  return safeParse<GameState>(localStorage.getItem(GAME_KEY));
}

export function saveGame(state: GameState | null): void {
  if (typeof localStorage === 'undefined') return;
  if (state === null) {
    localStorage.removeItem(GAME_KEY);
  } else {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  }
}

export function loadStats(): Stats {
  if (typeof localStorage === 'undefined') return EMPTY_STATS;
  return safeParse<Stats>(localStorage.getItem(STATS_KEY)) ?? EMPTY_STATS;
}

export function saveStats(stats: Stats): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordGameStarted(difficulty: Difficulty): Stats {
  const stats = loadStats();
  stats.played[difficulty] += 1;
  saveStats(stats);
  return stats;
}

export function recordGameWon(difficulty: Difficulty, elapsedMs: number): Stats {
  const stats = loadStats();
  stats.won[difficulty] += 1;
  const best = stats.bestTimes[difficulty];
  if (best === undefined || elapsedMs < best) {
    stats.bestTimes[difficulty] = elapsedMs;
  }
  saveStats(stats);
  return stats;
}

export function useStats(): [Stats, () => void] {
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const refresh = useCallback(() => setStats(loadStats()), []);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STATS_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);
  return [stats, refresh];
}
