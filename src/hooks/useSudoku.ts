import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Board, CellNotes, Difficulty, GameState } from '../utils/types';
import { generatePuzzle } from '../utils/generator';
import { findConflicts, isComplete, matchesSolution } from '../utils/validator';
import { rowOf, colOf, boxOf } from '../utils/types';

const MAX_UNDO = 50;

interface UndoEntry {
  index: number;
  prevValue: number;
  prevNotes: number[];
}

interface State {
  game: GameState | null;
  selected: number | null;
  notesMode: boolean;
  undoStack: UndoEntry[];
}

type Action =
  | { type: 'NEW_GAME'; payload: GameState }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SELECT'; index: number | null }
  | { type: 'TOGGLE_NOTES_MODE' }
  | { type: 'INPUT_DIGIT'; digit: number }
  | { type: 'ERASE' }
  | { type: 'UNDO' }
  | { type: 'REVEAL' }
  | { type: 'TICK_ELAPSED'; ms: number }
  | { type: 'ADD_PENALTY'; ms: number }
  | { type: 'INCR_HINT' }
  | { type: 'INCR_MISTAKES' }
  | { type: 'MARK_FINISHED' };

function pushUndo(state: State, entry: UndoEntry): UndoEntry[] {
  const next = state.undoStack.concat(entry);
  if (next.length > MAX_UNDO) next.shift();
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NEW_GAME':
    case 'LOAD_GAME':
      return { game: action.payload, selected: null, notesMode: false, undoStack: [] };

    case 'SELECT':
      return { ...state, selected: action.index };

    case 'TOGGLE_NOTES_MODE':
      return { ...state, notesMode: !state.notesMode };

    case 'INPUT_DIGIT': {
      if (!state.game || state.selected === null) return state;
      const i = state.selected;
      if (state.game.puzzle[i] !== 0) return state; // clue cell, immutable

      const game = state.game;
      const prevValue = game.current[i];
      const prevNotes = (game.notes[i] ?? []).slice();

      if (state.notesMode) {
        // Toggle the digit in this cell's notes; clear value if any.
        const notesArr = (game.notes[i] ?? []).slice();
        const pos = notesArr.indexOf(action.digit);
        if (pos >= 0) notesArr.splice(pos, 1);
        else notesArr.push(action.digit);
        notesArr.sort();
        const nextNotes: CellNotes = { ...game.notes, [i]: notesArr };
        const nextCurrent = game.current.slice();
        nextCurrent[i] = 0;
        return {
          ...state,
          game: { ...game, current: nextCurrent, notes: nextNotes },
          undoStack: pushUndo(state, { index: i, prevValue, prevNotes }),
        };
      }

      // Place a digit. Clear notes for this cell. Also clear matching candidate
      // notes from peers (row/col/box) for nicer UX.
      const nextCurrent = game.current.slice();
      nextCurrent[i] = action.digit;
      const nextNotes: CellNotes = { ...game.notes, [i]: [] };
      const r = rowOf(i);
      const c = colOf(i);
      const b = boxOf(i);
      for (const peer of Object.keys(nextNotes)) {
        const pi = Number(peer);
        if (pi === i) continue;
        if (rowOf(pi) === r || colOf(pi) === c || boxOf(pi) === b) {
          const arr = nextNotes[pi];
          if (!arr || arr.length === 0) continue;
          const filtered = arr.filter((d) => d !== action.digit);
          if (filtered.length !== arr.length) nextNotes[pi] = filtered;
        }
      }

      const newConflicts = findConflicts(nextCurrent);
      let mistakes = game.mistakes;
      if (newConflicts.has(i) && action.digit !== game.solution[i] && action.digit !== prevValue) {
        mistakes += 1;
      }

      return {
        ...state,
        game: { ...game, current: nextCurrent, notes: nextNotes, mistakes },
        undoStack: pushUndo(state, { index: i, prevValue, prevNotes }),
      };
    }

    case 'ERASE': {
      if (!state.game || state.selected === null) return state;
      const i = state.selected;
      const game = state.game;
      if (game.puzzle[i] !== 0) return state;
      const prevValue = game.current[i];
      const prevNotes = (game.notes[i] ?? []).slice();
      if (prevValue === 0 && prevNotes.length === 0) return state;
      const nextCurrent = game.current.slice();
      nextCurrent[i] = 0;
      const nextNotes: CellNotes = { ...game.notes, [i]: [] };
      return {
        ...state,
        game: { ...game, current: nextCurrent, notes: nextNotes },
        undoStack: pushUndo(state, { index: i, prevValue, prevNotes }),
      };
    }

    case 'UNDO': {
      if (!state.game || state.undoStack.length === 0) return state;
      const game = state.game;
      const entry = state.undoStack[state.undoStack.length - 1];
      const nextCurrent = game.current.slice();
      nextCurrent[entry.index] = entry.prevValue;
      const nextNotes: CellNotes = { ...game.notes, [entry.index]: entry.prevNotes.slice() };
      return {
        ...state,
        game: { ...game, current: nextCurrent, notes: nextNotes },
        selected: entry.index,
        undoStack: state.undoStack.slice(0, -1),
      };
    }

    case 'REVEAL': {
      if (!state.game || state.selected === null) return state;
      const i = state.selected;
      const game = state.game;
      if (game.puzzle[i] !== 0) return state;
      const correct = game.solution[i];
      if (game.current[i] === correct) return state;
      const prevValue = game.current[i];
      const prevNotes = (game.notes[i] ?? []).slice();
      const nextCurrent = game.current.slice();
      nextCurrent[i] = correct;
      const nextNotes: CellNotes = { ...game.notes, [i]: [] };
      return {
        ...state,
        game: { ...game, current: nextCurrent, notes: nextNotes, hintsUsed: game.hintsUsed + 1 },
        undoStack: pushUndo(state, { index: i, prevValue, prevNotes }),
      };
    }

    case 'TICK_ELAPSED':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, elapsedMs: action.ms } };

    case 'ADD_PENALTY':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, elapsedMs: state.game.elapsedMs + action.ms } };

    case 'MARK_FINISHED':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, finished: true } };

    case 'INCR_HINT':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, hintsUsed: state.game.hintsUsed + 1 } };

    case 'INCR_MISTAKES':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, mistakes: state.game.mistakes + 1 } };

    default:
      return state;
  }
}

export function createGame(difficulty: Difficulty): GameState {
  const { puzzle, solution } = generatePuzzle(difficulty);
  return {
    puzzle: puzzle.slice(),
    solution,
    current: puzzle.slice(),
    notes: {},
    difficulty,
    elapsedMs: 0,
    startedAt: Date.now(),
    finished: false,
    hintsUsed: 0,
    mistakes: 0,
  };
}

export interface SudokuApi {
  game: GameState | null;
  selected: number | null;
  notesMode: boolean;
  canUndo: boolean;
  conflicts: Set<number>;
  isWon: boolean;
  newGame: (difficulty: Difficulty) => GameState;
  loadGame: (state: GameState) => void;
  selectCell: (index: number | null) => void;
  toggleNotesMode: () => void;
  inputDigit: (digit: number) => void;
  erase: () => void;
  undo: () => void;
  reveal: () => void;
  setElapsed: (ms: number) => void;
  addPenalty: (ms: number) => void;
  markFinished: () => void;
  checkSolution: () => 'correct' | 'incomplete' | 'wrong';
}

export function useSudoku(initial: GameState | null): SudokuApi {
  const [state, dispatch] = useReducer(reducer, {
    game: initial,
    selected: null,
    notesMode: false,
    undoStack: [],
  });

  const conflicts = useMemo(
    () => (state.game ? findConflicts(state.game.current) : new Set<number>()),
    [state.game?.current],
  );

  const isWon = useMemo(() => {
    if (!state.game) return false;
    return isComplete(state.game.current) && matchesSolution(state.game.current, state.game.solution);
  }, [state.game]);

  // Track previous won state to fire MARK_FINISHED only once
  const wonRef = useRef(false);
  useEffect(() => {
    if (isWon && !wonRef.current) {
      wonRef.current = true;
      dispatch({ type: 'MARK_FINISHED' });
    }
    if (!isWon) wonRef.current = false;
  }, [isWon]);

  const newGame = useCallback((difficulty: Difficulty) => {
    const g = createGame(difficulty);
    dispatch({ type: 'NEW_GAME', payload: g });
    return g;
  }, []);

  const loadGame = useCallback((s: GameState) => {
    dispatch({ type: 'LOAD_GAME', payload: s });
  }, []);

  const selectCell = useCallback((index: number | null) => {
    dispatch({ type: 'SELECT', index });
  }, []);

  const toggleNotesMode = useCallback(() => dispatch({ type: 'TOGGLE_NOTES_MODE' }), []);
  const inputDigit = useCallback((digit: number) => dispatch({ type: 'INPUT_DIGIT', digit }), []);
  const erase = useCallback(() => dispatch({ type: 'ERASE' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const reveal = useCallback(() => dispatch({ type: 'REVEAL' }), []);
  const setElapsed = useCallback((ms: number) => dispatch({ type: 'TICK_ELAPSED', ms }), []);
  const addPenalty = useCallback((ms: number) => dispatch({ type: 'ADD_PENALTY', ms }), []);
  const markFinished = useCallback(() => dispatch({ type: 'MARK_FINISHED' }), []);

  const checkSolution = useCallback((): 'correct' | 'incomplete' | 'wrong' => {
    if (!state.game) return 'incomplete';
    const board: Board = state.game.current;
    let hasEmpty = false;
    for (let i = 0; i < 81; i++) if (!board[i]) hasEmpty = true;
    if (hasEmpty) return 'incomplete';
    return matchesSolution(board, state.game.solution) ? 'correct' : 'wrong';
  }, [state.game]);

  return {
    game: state.game,
    selected: state.selected,
    notesMode: state.notesMode,
    canUndo: state.undoStack.length > 0,
    conflicts,
    isWon,
    newGame,
    loadGame,
    selectCell,
    toggleNotesMode,
    inputDigit,
    erase,
    undo,
    reveal,
    setElapsed,
    addPenalty,
    markFinished,
    checkSolution,
  };
}
