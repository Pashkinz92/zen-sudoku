import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimerControls {
  elapsedMs: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (initialMs?: number) => void;
  addPenalty: (ms: number) => void;
}

export function useTimer(initialMs = 0, autoStart = false): TimerControls {
  const [elapsedMs, setElapsedMs] = useState(initialMs);
  const [isRunning, setIsRunning] = useState(autoStart);
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(initialMs);

  useEffect(() => {
    if (!isRunning) {
      if (startedAtRef.current !== null) {
        baseRef.current += performance.now() - startedAtRef.current;
        setElapsedMs(baseRef.current);
        startedAtRef.current = null;
      }
      return;
    }
    startedAtRef.current = performance.now();
    const id = window.setInterval(() => {
      const start = startedAtRef.current;
      if (start === null) return;
      setElapsedMs(baseRef.current + (performance.now() - start));
    }, 500);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // Pause when tab hidden, resume when visible (if running before).
  const wasRunningRef = useRef(false);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        wasRunningRef.current = isRunning;
        if (isRunning) setIsRunning(false);
      } else if (wasRunningRef.current) {
        setIsRunning(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((initial = 0) => {
    baseRef.current = initial;
    startedAtRef.current = isRunningSnapshot() ? performance.now() : null;
    setElapsedMs(initial);
  }, []);
  const addPenalty = useCallback((ms: number) => {
    baseRef.current += ms;
    setElapsedMs((m) => m + ms);
  }, []);

  // Tiny helper to read latest running flag inside reset without a stale closure.
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  function isRunningSnapshot() {
    return isRunningRef.current;
  }

  return { elapsedMs, isRunning, start, pause, reset, addPenalty };
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
