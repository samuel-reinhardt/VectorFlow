import * as React from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Node } from 'reactflow';
import { cn, getTextColorForBackground, hexToRgba } from '@/lib/utils';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Label } from '@/components/ui/forms/label';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { Switch } from '@/components/ui/forms/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/forms/radio-group';

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
import type { FieldDefinition, FieldType, ListDefinition } from '@/types';
import { normalizeOptions } from '@/lib/metadata-utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { Tag } from 'lucide-react';

interface MetaValueEditorProps {
  fields: FieldDefinition[];
  values: Record<string, any>;
  lists: ListDefinition[];
  onChange: (fieldId: string, value: any) => void;
}

export function MetaValueEditor({ fields, values, lists, onChange }: MetaValueEditorProps) {
  if (fields.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic py-2">
        No custom fields defined.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (!field) return null;
        return (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <RenderField 
              field={field} 
              value={values[field.id]} 
              lists={lists}
              onChange={(val) => onChange(field.id, val)} 
            />
          </div>
        );
      })}
    </div>
  );
}

function RenderField({ 
  field, 
  value, 
  lists,
  onChange 
}: { 
  field: FieldDefinition; 
  value: any; 
  lists: ListDefinition[];
  onChange: (val: any) => void 
}) {
  const getOptions = () => {
     if (field.optionsSource === 'list' && field.listId) {
         const list = lists.find(l => l.id === field.listId);
         return list ? list.items : [];
     }
     return normalizeOptions(field.options);
  };

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
      const options = getOptions();
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter(opt => opt.value !== '')
              .map((opt, i) => (
              <SelectItem key={`${opt.value}-${i}`} value={opt.value}>
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
      const options = getOptions();
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
                .map((opt, i) => (
                  <SelectItem key={`${opt.value}-${i}`} value={opt.value}>
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
              {currentValues.map((val: string) => {
                const opt = options.find(o => o.value === val);
                const color = opt?.color;
                const isDark = color ? getTextColorForBackground(color) === '#FFFFFF' : true;
                const textColor = isDark ? color : '#1f2937';

                return (
                  <Badge 
                    key={val} 
                    variant="secondary" 
                    className="gap-1 px-1.5 py-0.5 h-6 border"
                    style={color ? {
                      backgroundColor: hexToRgba(color, 0.15),
                      borderColor: hexToRgba(color, 0.3),
                      color: textColor,
                    } : undefined}
                  >
                    {opt?.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-3 h-3" />}
                    {opt?.label || val}
                    <button 
                      onClick={() => onChange(currentValues.filter((v: string) => v !== val))}
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

    case 'checkbox-group': {
        const options = getOptions();
        const current = Array.isArray(value) ? value : [];
        return (
            <div className="space-y-2">
                {options.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`${field.id}-${opt.value}`}
                            checked={current.includes(opt.value)}
                            onCheckedChange={(checked) => {
                                if (checked) onChange([...current, opt.value]);
                                else onChange(current.filter((v: string) => v !== opt.value));
                            }}
                        />
                        <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer flex items-center gap-2">
                             {opt.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-4 h-4" />}
                             {opt.label}
                        </Label>
                    </div>
                ))}
            </div>
        );
    }

    case 'radio': {
        const options = getOptions();
        return (
            <RadioGroup value={value || ''} onValueChange={onChange}>
                {options.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
                        <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer flex items-center gap-2">
                             {opt.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-4 h-4" />}
                             {opt.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        );
    }

    case 'toggle':
      return (
        <div className="flex items-center space-x-2">
            <Switch checked={!!value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? 'On' : 'Off'}</span>
        </div>
      );
      
    default:
      return <div className="text-xs text-destructive">Unsupported field type: {field.type}</div>;
  }
}
