/**
 * Manages local storage persistence for project flows and application state.
 */

import { Flow } from '@/types';
import { STORAGE } from '@/lib/constants';

const STORAGE_KEY = STORAGE.KEY;
const STORAGE_VERSION = STORAGE.VERSION;

interface PersistedState {
  version: string;
  flows: Flow[];
  activeFlowId: string;
}

export const StorageManager = {
  /**
   * Saves the current application state to local storage.
   */
  save: (flows: Flow[], activeFlowId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const state: PersistedState = {
        version: STORAGE_VERSION,
        flows,
        activeFlowId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  },

  /**
   * Loads the application state from local storage.
   */
  load: (): { flows: Flow[]; activeFlowId: string } | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state: PersistedState = JSON.parse(stored);
      
      // Basic version check - could implement migrations here if needed
      if (state.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch. Resetting state.');
        return null;
      }

      return {
        flows: state.flows,
        activeFlowId: state.activeFlowId,
      };
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return null;
    }
  },

  /**
   * Clears the application state from local storage.
   */
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
