'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Manages the animated flow-transition that fires whenever the active flow tab
 * changes (switch, import, delete, etc.).
 *
 * Behaviour:
 *  1. Immediately hides the ReactFlow viewport and shows the loading overlay.
 *  2. After a short settle delay, snaps the view to centre (still hidden).
 *  3. Fades the viewport back in and fires a secondary animated `fitView`.
 *  4. Cleans up all inline styles after the animation completes.
 *
 * @returns `isTransitioning` — true while the overlay should be visible.
 */
export function useFlowTransition(
  activeFlowId: string,
  fitView: (opts?: { padding?: number; duration?: number; nodes?: { id: string }[] }) => void,
): boolean {
  const prevActiveFlowIdRef = useRef(activeFlowId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (prevActiveFlowIdRef.current === activeFlowId) return;
    prevActiveFlowIdRef.current = activeFlowId;

    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (viewportEl) {
      viewportEl.style.transition = 'none';
      viewportEl.style.opacity = '0';
    }
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });

      if (viewportEl) {
        viewportEl.style.transition = 'opacity 250ms ease-in';
        viewportEl.style.opacity = '1';
      }
      setIsTransitioning(false);

      requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.15 });
      });

      const cleanupTimer = setTimeout(() => {
        if (viewportEl) viewportEl.style.transition = '';
      }, 300);

      return () => clearTimeout(cleanupTimer);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (viewportEl) {
        viewportEl.style.transition = '';
        viewportEl.style.opacity = '1';
      }
      setIsTransitioning(false);
    };
  }, [activeFlowId, fitView]);

  return isTransitioning;
}
