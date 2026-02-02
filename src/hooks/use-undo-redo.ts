import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoResult<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
  reset: (newState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initialState: T): UndoRedoResult<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const takeSnapshot = useCallback(() => {
    setHistory((curr) => {
      // Don't modify history if state hasn't changed (deep equality check might be too expensive, 
      // so we rely on explicit snapshot calls on actions)
      
      const newPast = [...curr.past, curr.present];
      if (newPast.length > MAX_HISTORY) {
        newPast.shift(); // Remove oldest
      }

      return {
        past: newPast,
        present: curr.present, // Present remains same until setState called, or we can use this to just bookmark
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const setState = useCallback((newStateOrFn: T | ((prev: T) => T)) => {
    setHistory((curr) => ({
      ...curr,
      present: typeof newStateOrFn === 'function' ? (newStateOrFn as (prev: T) => T)(curr.present) : newStateOrFn,
    }));
  }, []);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    takeSnapshot,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
