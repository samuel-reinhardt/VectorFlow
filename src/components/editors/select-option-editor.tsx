'use client';

import * as React from 'react';
import { Plus, X, Palette, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { SelectOption } from '@/types';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { COMMON_ICONS } from '@/lib/constants';

interface SelectOptionEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
}

export function SelectOptionEditor({ options, onChange }: SelectOptionEditorProps) {
  const addOption = () => {
    onChange([...options, { value: '', label: '' }]);
  };

  const updateOption = (index: number, updates: Partial<SelectOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-start gap-2 p-2 border rounded-md bg-background">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="Value"
                value={opt.value}
                onChange={(e) => updateOption(i, { value: e.target.value })}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Label"
                value={opt.label}
                onChange={(e) => updateOption(i, { label: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="color"
                value={opt.color || '#3b82f6'}
                onChange={(e) => updateOption(i, { color: e.target.value })}
                className="h-8 w-12 p-1 cursor-pointer"
                title="Color"
              />
              <select
                value={opt.icon || ''}
                onChange={(e) => updateOption(i, { icon: e.target.value || undefined })}
                className="h-8 px-2 text-xs border rounded-md bg-background"
                title="Icon"
              >
                <option value="">No icon</option>
                {COMMON_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeOption(i)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addOption}
        className="w-full h-8"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Option
      </Button>
    </div>
  );
}
