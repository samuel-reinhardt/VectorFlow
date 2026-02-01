/**
 * Centralized constants for the VectorFlow application.
 * This file contains all magic numbers, default values, and configuration constants.
 */

// Node and deliverable dimensions
export const DIMENSIONS = {
  STEP_WIDTH: 220,
  STEP_INITIAL_HEIGHT: 60,
  STEP_HEADER_HEIGHT: 48,
  DELIVERABLE_HEIGHT: 40,
  DELIVERABLE_Y_PADDING: 8,
  DELIVERABLE_X_PADDING: 12,
  get DELIVERABLE_WIDTH() {
    return this.STEP_WIDTH - (this.DELIVERABLE_X_PADDING * 2);
  }
} as const;

// Default colors for various elements
export const DEFAULT_COLORS = {
  STEP: '#E5E7EB',
  DELIVERABLE: '#edf2f7',
  GROUP: '#3B82F6',
  CONNECTION: '#6B7280',
} as const;

// Z-index layering for proper visual stacking
export const Z_INDEX = {
  GROUP: 0,
  CONNECTION: 10,
  CONNECTION_LABEL: 15,
  STEP: 30,
  DELIVERABLE: 40,
} as const;

// Storage-related constants
export const STORAGE = {
  KEY: 'vector-flow-state',
  VERSION: '1.0',
} as const;
