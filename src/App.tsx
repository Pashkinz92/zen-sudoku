import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import { Board } from './components/Board/Board';
import { NumPad } from './components/NumPad/NumPad';
import { Timer } from './components/Timer/Timer';
import { DifficultyCard } from './components/DifficultyCard/DifficultyCard';
import { WinScreen } from './components/WinScreen/WinScreen';
import { StatsScreen } from './components/StatsScreen/StatsScreen';
import { useSudoku, createGame } from './hooks/useSudoku';
import { useTimer, formatTime } from './hooks/useTimer';
import {
  loadGame,
  saveGame,
  recordGameStarted,
  recordGameWon,
  useStats,
} from './hooks/usePersistence';
import type { Difficulty } from './utils/types';

type Screen = 'home' | 'game' | 'stats';

const HINT_PENALTY_MS = 30_000;

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [savedGame, setSavedGame] = useState(() => loadGame());
  const [stats, refreshStats] = useStats();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [winShown, setWinShown] = useState(false);
  const [winInfo, setWinInfo] = useState<{ isNewBest: boolean } | null>(null);

  const sudoku = useSudoku(null);
  const timer = useTimer(0, false);

  const showToast = useCallback((msg: string, duration = 1800) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), duration);
  }, []);

  // Auto-save on game state change (debounced lightly via rAF batching).
  const saveDirtyRef = useRef(false);
  useEffect(() => {
    if (!sudoku.game) return;
    if (sudoku.game.finished) return;
    saveDirtyRef.current = true;
    const id = window.setTimeout(() => {
      if (sudoku.game && !sudoku.game.finished && saveDirtyRef.current) {
        saveGame({ ...sudoku.game, elapsedMs: timer.elapsedMs });
        saveDirtyRef.current = false;
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [sudoku.game, timer.elapsedMs]);

  // Win detection
  useEffect(() => {
    if (sudoku.isWon && sudoku.game && !winShown) {
      timer.pause();
      const finalMs = timer.elapsedMs;
      const prevBest = stats.bestTimes[sudoku.game.difficulty];
      const isNewBest = prevBest === undefined || finalMs < prevBest;
      recordGameWon(sudoku.game.difficulty, finalMs);
      refreshStats();
      saveGame(null);
      setSavedGame(null);
      setWinInfo({ isNewBest });
      setWinShown(true);
    }
  }, [sudoku.isWon, sudoku.game, timer.elapsedMs, winShown, stats.bestTimes, refreshStats, timer]);

  const startGame = useCallback(
    (difficulty: Difficulty) => {
      const g = createGame(difficulty);
      sudoku.loadGame(g);
      timer.reset(0);
      timer.start();
      recordGameStarted(difficulty);
      refreshStats();
      saveGame(g);
      setSavedGame(g);
      setWinShown(false);
      setWinInfo(null);
      setScreen('game');
    },
    [sudoku, timer, refreshStats],
  );

  const continueGame = useCallback(() => {
    const saved = loadGame();
    if (!saved) return;
    sudoku.loadGame(saved);
    timer.reset(saved.elapsedMs);
    timer.start();
    setWinShown(false);
    setScreen('game');
  }, [sudoku, timer]);

  const exitToHome = useCallback(() => {
    timer.pause();
    if (sudoku.game && !sudoku.game.finished) {
      saveGame({ ...sudoku.game, elapsedMs: timer.elapsedMs });
      setSavedGame({ ...sudoku.game, elapsedMs: timer.elapsedMs });
    }
    setMenuOpen(false);
    setScreen('home');
  }, [sudoku.game, timer]);

  const restartGame = useCallback(() => {
    if (!sudoku.game) return;
    const fresh = {
      ...sudoku.game,
      current: sudoku.game.puzzle.slice(),
      notes: {},
      elapsedMs: 0,
      startedAt: Date.now(),
      hintsUsed: 0,
      mistakes: 0,
      finished: false,
    };
    sudoku.loadGame(fresh);
    timer.reset(0);
    timer.start();
    setWinShown(false);
    setMenuOpen(false);
  }, [sudoku, timer]);

  const handleHint = useCallback(() => {
    if (!sudoku.game || sudoku.selected === null) {
      showToast('Select a cell first');
      return;
    }
    if (sudoku.game.puzzle[sudoku.selected] !== 0) {
      showToast('Cannot reveal a clue');
      return;
    }
    sudoku.reveal();
    timer.addPenalty(HINT_PENALTY_MS);
    showToast(`+${HINT_PENALTY_MS / 1000}s penalty`);
  }, [sudoku, timer, showToast]);

  const handleCheck = useCallback(() => {
    const result = sudoku.checkSolution();
    if (result === 'correct') showToast('Looks right!');
    else if (result === 'incomplete') showToast('Still some empties');
    else {
      showToast('Some cells are wrong');
      timer.addPenalty(HINT_PENALTY_MS);
    }
    setMenuOpen(false);
  }, [sudoku, timer, showToast]);

  // Keyboard support
  useEffect(() => {
    if (screen !== 'game') return;
    const onKey = (e: KeyboardEvent) => {
      if (sudoku.selected === null) return;
      if (e.key >= '1' && e.key <= '9') {
        sudoku.inputDigit(parseInt(e.key, 10));
        e.preventDefault();
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        sudoku.erase();
        e.preventDefault();
      } else if (e.key === 'n' || e.key === 'N') {
        sudoku.toggleNotesMode();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        sudoku.undo();
        e.preventDefault();
      } else if (e.key.startsWith('Arrow')) {
        const r = Math.floor(sudoku.selected / 9);
        const c = sudoku.selected % 9;
        let nr = r;
        let nc = c;
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        if (e.key === 'ArrowDown') nr = Math.min(8, r + 1);
        if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        if (e.key === 'ArrowRight') nc = Math.min(8, c + 1);
        sudoku.selectCell(nr * 9 + nc);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, sudoku]);

  const bestForCard = useCallback(
    (d: Difficulty) => {
      const ms = stats.bestTimes[d];
      return ms !== undefined ? formatTime(ms) : undefined;
    },
    [stats],
  );

  const headerBest = useMemo(() => {
    if (!savedGame) return null;
    return `${savedGame.difficulty} · ${formatTime(savedGame.elapsedMs)}`;
  }, [savedGame]);

  // ------- Render -------

  if (screen === 'stats') {
    return (
      <div className={styles.app}>
        <StatsScreen stats={stats} onBack={() => setScreen('home')} />
      </div>
    );
  }

  if (screen === 'home') {
    return (
      <div className={styles.app}>
        <div className={styles.home}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Zen Sudoku</h1>
            <p className={styles.brandSubtitle}>A calm place to think</p>
          </div>

          {savedGame && (
            <button type="button" className={styles.continue} onClick={continueGame}>
              <div>
                <div className={styles.continueLabel}>Continue</div>
                <div className={styles.continueMeta}>{headerBest}</div>
              </div>
              <span className={styles.continueArrow}>→</span>
            </button>
          )}

          <h2 className={styles.sectionLabel}>New game</h2>
          <div className={styles.cards}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <DifficultyCard
                key={d}
                difficulty={d}
                bestTime={bestForCard(d)}
                onSelect={startGame}
              />
            ))}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => setScreen('stats')}
            >
              Statistics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // game screen
  if (!sudoku.game) {
    return (
      <div className={styles.app}>
        <div className={styles.home}>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <div className={styles.game}>
        <div className={styles.gameHeader}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={exitToHome}
            aria-label="Back to home"
          >
            ←
          </button>
          <div className={styles.badge}>{sudoku.game.difficulty}</div>
          <Timer ms={timer.elapsedMs} />
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            ⋯
          </button>
        </div>
        <div className={styles.boardArea}>
          <Board
            puzzle={sudoku.game.puzzle}
            current={sudoku.game.current}
            notes={sudoku.game.notes}
            selected={sudoku.selected}
            conflicts={sudoku.conflicts}
            onSelectCell={sudoku.selectCell}
          />
        </div>
        <NumPad
          current={sudoku.game.current}
          notesMode={sudoku.notesMode}
          canUndo={sudoku.canUndo}
          onDigit={sudoku.inputDigit}
          onErase={sudoku.erase}
          onUndo={sudoku.undo}
          onToggleNotes={sudoku.toggleNotesMode}
          onHint={handleHint}
        />
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {menuOpen && (
        <div className={styles.menu} onClick={() => setMenuOpen(false)}>
          <div className={styles.menuSheet} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.menuItem} onClick={handleCheck}>
              Check solution
            </button>
            <button type="button" className={styles.menuItem} onClick={restartGame}>
              Restart puzzle
            </button>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                if (!sudoku.game) return;
                startGame(sudoku.game.difficulty);
                setMenuOpen(false);
              }}
            >
              New {sudoku.game.difficulty} puzzle
            </button>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={exitToHome}
            >
              Quit to home
            </button>
          </div>
        </div>
      )}

      {winShown && winInfo && (
        <WinScreen
          difficulty={sudoku.game.difficulty}
          elapsedMs={timer.elapsedMs}
          hintsUsed={sudoku.game.hintsUsed}
          mistakes={sudoku.game.mistakes}
          isNewBest={winInfo.isNewBest}
          onPlayAgain={() => startGame(sudoku.game!.difficulty)}
          onChangeDifficulty={() => {
            setWinShown(false);
            setScreen('home');
          }}
        />
      )}
    </div>
  );
}
