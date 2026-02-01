export type FieldType = 'text' | 'long-text' | 'date' | 'select' | 'multi-select';

export type FieldDefinition = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
};

export type MetaConfig = {
  step: FieldDefinition[];
  deliverable: FieldDefinition[];
  group: FieldDefinition[];
};

export const EMPTY_META_CONFIG: MetaConfig = {
  step: [],
  deliverable: [],
  group: []
};
