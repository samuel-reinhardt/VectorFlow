/**
 * Manages local storage persistence for project flows and application state.
 */

import { Flow } from '@/types';
import { STORAGE } from '@/lib/constants';

const STORAGE_KEY = STORAGE.KEY;
const STORAGE_VERSION = STORAGE.VERSION;

interface PersistedState {
  version: string;
  projectId: string;
  projectName?: string;
  flows: Flow[];
  activeFlowId: string;
  googleDriveFileId?: string;
}

export const StorageManager = {
  /**
   * Saves the current application state to local storage.
   */
  save: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string, googleDriveFileId?: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const state: PersistedState = {
        version: STORAGE_VERSION,
        projectId,
        projectName,
        flows,
        activeFlowId,
        googleDriveFileId,
      };

      const replacer = (key: string, value: any) => {
        // Filter out Window objects
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Window') {
          return undefined;
        }
        // Filter out DOM elements
        if (value && typeof value === 'object' && value instanceof Node) { // Check for DOM Node
            return undefined;
        }
        // Basic circular reference check
        // Note: WeakSet approach works for basic cycles
        return value;
      };

      // Since JSON.stringify doesn't verify deep cycles easily with just a replacer without set
      // Let's implement a cycle-safe stringify helper inline or try-catch wrap if needed.
      // Actually, let's use a known safe-stringify approach
      
      const seen = new WeakSet();
      const safeReplacer = (key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          // Filter out Window/DOM
          if (value.constructor && (value.constructor.name === 'Window' || value.constructor.name === 'HTMLDocument')) {
             return undefined;
          }
          // Filter out React Synthetic Events
          if (value._reactName) {
             return undefined;
          }
           
          seen.add(value);
        }
        return value;
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state, safeReplacer));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  },

  /**
   * Loads the application state from local storage.
   */
  load: (): { flows: Flow[]; activeFlowId: string; projectId: string; projectName?: string; googleDriveFileId?: string } | null => {
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
        projectId: state.projectId,
        projectName: state.projectName,
        googleDriveFileId: state.googleDriveFileId,
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
