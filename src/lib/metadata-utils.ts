import { SelectOption } from '@/types';

/**
 * Utility functions for working with metadata field options
 */

/**
 * Normalize options to SelectOption[] format
 * Handles backward compatibility with string[] format
 */
export function normalizeOptions(options?: string[] | SelectOption[]): SelectOption[] {
  if (!options || options.length === 0) return [];
  
  // Check if first item is a string (old format)
  if (typeof options[0] === 'string') {
    return (options as string[]).map(value => ({
      value,
      label: value,
    }));
  }
  
  // Already in new format
  return options as SelectOption[];
}

/**
 * Get option by value
 */
export function getOptionByValue(
  options: string[] | SelectOption[] | undefined,
  value: string
): SelectOption | undefined {
  const normalized = normalizeOptions(options);
  return normalized.find(opt => opt.value === value);
}

/**
 * Get multiple options by values
 */
export function getOptionsByValues(
  options: string[] | SelectOption[] | undefined,
  values: string[]
): SelectOption[] {
  const normalized = normalizeOptions(options);
  return values
    .map(value => normalized.find(opt => opt.value === value))
    .filter((opt): opt is SelectOption => opt !== undefined);
}
