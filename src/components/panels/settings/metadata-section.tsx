'use client';

import { Tags } from 'lucide-react';
import { MetaValueEditor } from '@/components/editors/meta-value-editor';
import type { FieldDefinition } from '@/types';

interface MetadataSectionProps {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}

/**
 * Metadata section for editing custom fields on entities.
 * Displays the metadata editor with configured fields.
 */
export function MetadataSection({ fields, values, onChange }: MetadataSectionProps) {
  return (
    <div className="pt-4 border-t space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Tags className="w-4 h-4" />
        Custom Metadata
      </div>
      <MetaValueEditor 
        fields={fields} 
        values={values} 
        onChange={onChange}
      />
    </div>
  );
}
