'use client';

import * as React from 'react';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { NumberConfig } from '@/types';

interface NumberConfigEditorProps {
  config: NumberConfig | undefined;
  onChange: (config: NumberConfig) => void;
  fieldType: 'number' | 'hours' | 'currency' | 'slider';
}

export function NumberConfigEditor({ config, onChange, fieldType }: NumberConfigEditorProps) {
  const defaults: Record<string, NumberConfig> = {
    number: { step: 1 },
    hours: { min: 0, step: 0.5 },
    currency: { min: 0, step: 0.01 },
    slider: { min: 0, max: 100, step: 1 },
  };

  const currentConfig: NumberConfig = config || defaults[fieldType];

  const update = (key: keyof NumberConfig, value: number | undefined) => {
    onChange({ ...currentConfig, [key]: value });
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Number Constraints</Label>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Min</Label>
          <Input
            type="number"
            value={currentConfig.min ?? ''}
            onChange={(e) => update('min', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="No min"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max</Label>
          <Input
            type="number"
            value={currentConfig.max ?? ''}
            onChange={(e) => update('max', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="No max"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Step</Label>
          <Input
            type="number"
            value={currentConfig.step ?? ''}
            onChange={(e) => update('step', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={String(defaults[fieldType].step)}
            className="h-8 text-xs"
            step="any"
          />
        </div>
      </div>
    </div>
  );
}
