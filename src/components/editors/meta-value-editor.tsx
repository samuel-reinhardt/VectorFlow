'use client';

import * as React from 'react';
import { format, isValid } from 'date-fns';
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
import type { FieldDefinition, FieldType } from '@/types';
import { normalizeOptions } from '@/lib/metadata-utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { Tag } from 'lucide-react';

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
      
    case 'number':
      return (
        <Input 
          type="number"
          value={value ?? ''} 
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} 
          placeholder="Enter number..."
          min={field.numberConfig?.min}
          max={field.numberConfig?.max}
          step={field.numberConfig?.step ?? 1}
        />
      );
      
    case 'hours':
      return (
        <div className="relative">
          <Input 
            type="number"
            value={value ?? ''} 
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} 
            placeholder="Enter hours..."
            min={field.numberConfig?.min ?? 0}
            max={field.numberConfig?.max}
            step={field.numberConfig?.step ?? 0.5}
            className="pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            hrs
          </span>
        </div>
      );
      
    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input 
            type="number"
            value={value ?? ''} 
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} 
            placeholder="0.00"
            min={field.numberConfig?.min ?? 0}
            max={field.numberConfig?.max}
            step={field.numberConfig?.step ?? 0.01}
            className="pl-7"
          />
        </div>
      );
      
    case 'slider': {
      const min = field.numberConfig?.min ?? 0;
      const max = field.numberConfig?.max ?? 100;
      const step = field.numberConfig?.step ?? 1;
      const numValue = value ?? min;
      
      return (
        <div className="space-y-2">
          <input
            type="range"
            value={numValue}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span className="font-medium text-foreground">{numValue}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }
      
    case 'date':
      const dateValue = value ? new Date(value) : null;
      const isValidDate = dateValue && isValid(dateValue);
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !isValidDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isValidDate ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={isValidDate ? dateValue : undefined}
              onSelect={(date) => onChange(date ? date.toISOString() : null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
      
    case 'select': {
      const options = normalizeOptions(field.options);
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  {opt.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-4 h-4" />}
                  <span>{opt.label}</span>
                  {opt.color && (
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{backgroundColor: opt.color}}
                    />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
      
    case 'multi-select': {
      const options = normalizeOptions(field.options);
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
              {options
                .filter(opt => !currentValues.includes(opt.value) && opt.value !== '')
                .map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-4 h-4" />}
                      <span>{opt.label}</span>
                      {opt.color && (
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{backgroundColor: opt.color}}
                        />
                      )}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {currentValues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {currentValues.map((val) => {
                const opt = options.find(o => o.value === val);
                return (
                  <Badge 
                    key={val} 
                    variant="secondary" 
                    className="gap-1 px-1.5 py-0.5 h-6"
                    style={opt?.color ? {
                      backgroundColor: `${opt.color}20`,
                      color: opt.color,
                      borderColor: opt.color
                    } : undefined}
                  >
                    {opt?.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-3 h-3" />}
                    {opt?.label || val}
                    <button 
                      onClick={() => onChange(currentValues.filter(v => v !== val))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      );
    }
      
    default:
      return <div className="text-xs text-destructive">Unsupported field type: {field.type}</div>;
  }
}
