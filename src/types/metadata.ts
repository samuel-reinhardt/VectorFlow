export type FieldType = 
  | 'text' 
  | 'long-text' 
  | 'date' 
  | 'select' 
  | 'multi-select'
  | 'number'        // General number input
  | 'hours'         // Number with "hrs" suffix
  | 'currency'      // Number with "$" prefix
  | 'slider';       // Range slider input

export type SelectOption = {
  value: string;
  label: string;
  color?: string;   // Hex color for badge
  icon?: string;    // Icon name
};

export type NumberConfig = {
  min?: number;
  max?: number;
  step?: number;
};

export type FieldDefinition = {
  id: string;
  label: string;
  type: FieldType;
  // For select/multi-select - support both formats for backward compatibility
  options?: string[] | SelectOption[];
  // For number types
  numberConfig?: NumberConfig;
};

export type MetaConfig = {
  step: FieldDefinition[];
  deliverable: FieldDefinition[];
  group: FieldDefinition[];
  edge: FieldDefinition[];
};

export const EMPTY_META_CONFIG: MetaConfig = {
  step: [],
  deliverable: [],
  group: [],
  edge: []
};
