'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  /** Called on Cmd/Ctrl+Z (without Shift). */
  onUndo: () => void;
  /** Called on Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y. */
  onRedo: () => void;
  /** Called on Cmd/Ctrl+C (when no input is focused). */
  onCopy: () => void;
  /** Called on Cmd/Ctrl+V (when no input is focused). */
  onPaste: () => void;
  /** When true, all shortcuts are suppressed. */
  isReadOnly: boolean;
}

/**
 * Registers the application-wide keyboard shortcuts for undo/redo and
 * clipboard operations. Automatically cleans up the event listener on
 * unmount.
 *
 * Copy and paste are suppressed when an `<input>` or `<textarea>` has focus
 * so that normal text editing is unaffected.
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  isReadOnly,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      const mod = e.metaKey || e.ctrlKey;
      const inInput = ['INPUT', 'TEXTAREA'].includes(
        (e.target as HTMLElement).tagName,
      );

      if (mod && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? onRedo() : onUndo();
        return;
      }

      if (mod && e.key === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      if (inInput) return; // clipboard shortcuts only outside inputs

      if (mod && e.key === 'c') {
        e.preventDefault();
        onCopy();
        return;
      }

      if (mod && e.key === 'v') {
        e.preventDefault();
        onPaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onCopy, onPaste, isReadOnly]);
}
