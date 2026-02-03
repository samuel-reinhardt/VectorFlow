'use client';

import * as React from 'react';
import { Plus, X, Tag as TagIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { SelectOption } from '@/types';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { IconBrowserDialog } from '@/components/common/icon-browser-dialog';
import { ColorPickerDialog } from '@/components/common/color-picker-dialog';

interface SelectOptionEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
  palette?: string[];
}

export function SelectOptionEditor({ options, onChange, palette = [] }: SelectOptionEditorProps) {
  const [dialogState, setDialogState] = React.useState<{
    type: 'icon' | 'color';
    index: number;
  } | null>(null);

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

  const handleIconSelect = (icon: string) => {
    if (dialogState?.type === 'icon') {
      updateOption(dialogState.index, { icon });
    }
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <OptionRow
            key={i}
            option={opt}
            onChange={(updates) => updateOption(i, updates)}
            onRemove={() => removeOption(i)}
            onEditColor={() => setDialogState({ type: 'color', index: i })}
            onEditIcon={() => setDialogState({ type: 'icon', index: i })}
          />
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

      <IconBrowserDialog
        open={dialogState?.type === 'icon'}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSelect={handleIconSelect}
        title="Select Option Icon"
      />
      
      <ColorPickerDialog
        open={dialogState?.type === 'color'}
        onOpenChange={(open) => !open && setDialogState(null)}
        color={dialogState ? options[dialogState.index]?.color || '#000000' : '#000000'}
        onChange={(color) => dialogState && updateOption(dialogState.index, { color })}
        palette={palette}
        title="Select Option Color"
      />
    </div>
  );
}

function OptionRow({ 
  option, 
  onChange, 
  onRemove,
  onEditColor,
  onEditIcon
}: { 
  option: SelectOption; 
  onChange: (updates: Partial<SelectOption>) => void; 
  onRemove: () => void;
  onEditColor: () => void;
  onEditIcon: () => void;
}) {
  const [showValue, setShowValue] = React.useState(false);

  return (
    <div className="border rounded-md bg-background hover:bg-muted/10 transition-colors">
      <div className="flex items-center gap-2 p-2">
        <div className="flex-1">
             <Input
                placeholder="Label"
                value={option.label}
                onChange={(e) => {
                    const newLabel = e.target.value;
                    // Auto-sync value if it's empty or matches the old label (keeping them in sync)
                    onChange({ 
                        label: newLabel, 
                        value: (!option.value || option.value === option.label) ? newLabel : option.value 
                    });
                }}
                className="h-8 text-xs font-medium"
             />
        </div>
        
        <div className="flex items-center gap-2">
              <button 
                  onClick={onEditColor}
                  className="w-8 h-8 rounded border p-0 overflow-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:ring-2 shrink-0"
                  style={{ backgroundColor: option.color || '#3b82f6' }}
                  title="Pick color"
              />
              
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 px-0 shrink-0"
                  onClick={onEditIcon}
                  title="Pick Icon"
              >
                  {option.icon ? (
                      <DynamicIcon name={option.icon} fallback={TagIcon} className="h-4 w-4" />
                  ) : (
                      <TagIcon className="h-4 w-4 text-muted-foreground opacity-50" />
                  )}
              </Button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-1">
             <Button
                variant={showValue ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 text-muted-foreground shrink-0"
                onClick={() => setShowValue(!showValue)}
                title="Edit Underlying Value"
             >
                <span className="text-[10px] font-mono">V</span>
             </Button>
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={onRemove}
                title="Remove Option"
             >
                <X className="h-3 w-3" />
             </Button>
        </div>
      </div>

      {showValue && (
          <div className="px-2 pb-2 pt-1 bg-muted/20 border-t border-dashed">
              <div className="flex items-center gap-2">
                   <Label className="text-[10px] text-muted-foreground w-8 shrink-0">Value:</Label>
                   <Input
                        placeholder="Underlying Value (optional)"
                        value={option.value}
                        onChange={(e) => onChange({ value: e.target.value })}
                        className="h-7 text-xs flex-1 font-mono bg-background/50"
                   />
              </div>
          </div>
      )}
    </div>
  );
}
