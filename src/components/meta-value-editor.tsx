'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Node } from 'reactflow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Label } from '@/components/ui/forms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlay/popover';
import { Calendar } from '@/components/ui/data-display/calendar';
import { Badge } from '@/components/ui/data-display/badge';
import type { FieldDefinition, FieldType } from '@/hooks/use-vector-flow';

interface MetaValueEditorProps {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}

export function MetaValueEditor({ fields, values, onChange }: MetaValueEditorProps) {
  if (fields.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic py-2">
        No custom fields defined.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label className="text-sm font-medium">{field.label}</Label>
          <RenderField 
            field={field} 
            value={values[field.id]} 
            onChange={(val) => onChange(field.id, val)} 
          />
        </div>
      ))}
    </div>
  );
}

function RenderField({ 
  field, 
  value, 
  onChange 
}: { 
  field: FieldDefinition; 
  value: any; 
  onChange: (val: any) => void 
}) {
  switch (field.type) {
    case 'text':
      return (
        <Input 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );
    case 'long-text':
      return (
        <Textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          className="min-h-[80px]"
        />
      );
    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date ? date.toISOString() : null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'multi-select':
      const currentValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <Select 
            value="" 
            onValueChange={(val) => {
              if (!currentValues.includes(val)) {
                onChange([...currentValues, val]);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.filter(opt => !currentValues.includes(opt)).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentValues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {currentValues.map((val) => (
                <Badge key={val} variant="secondary" className="gap-1 px-1.5 py-0.5 h-6">
                  {val}
                  <button 
                    onClick={() => onChange(currentValues.filter(v => v !== val))}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    default:
      return <div className="text-xs text-destructive">Unsupported field type: {field.type}</div>;
  }
}
