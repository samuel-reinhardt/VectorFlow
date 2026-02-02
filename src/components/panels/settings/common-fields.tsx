'use client';

import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { IconPicker } from '@/components/common/icon-picker';
import { ExternalLink, Square, FileText, Layers, Share2 } from 'lucide-react';

interface CommonFieldsProps {
  label: string;
  color: string;
  icon: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIconChange: (icon: string) => void;
  entityType: 'step' | 'deliverable' | 'group' | 'edge';
}

/**
 * Common form fields (Label, Color, Icon) shared across all entity types.
 * Reduces duplication in the settings panel.
 */
export function CommonFields({
  label,
  color,
  icon,
  onLabelChange,
  onColorChange,
  onIconChange,
  entityType,
}: CommonFieldsProps) {
  const getFallbackIcon = () => {
    switch (entityType) {
      case 'deliverable':
        return FileText;
      case 'group':
        return Layers;
      case 'edge':
        return Share2;
      default:
        return Square;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label-input" className="font-semibold">Label</Label>
        <Input
          id="label-input"
          value={label}
          onChange={onLabelChange}
          placeholder="Enter label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color-input" className="font-semibold">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color-input"
            type="color"
            value={color}
            onChange={onColorChange}
            className="p-1 h-10 w-14 cursor-pointer"
          />
          <Input value={color} onChange={onColorChange} placeholder="#RRGGBB" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">Icon</Label>
          <a 
            href="https://lucide.dev/icons" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
          >
            Browse all icons
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <IconPicker
          value={icon}
          onChange={onIconChange}
          fallbackIcon={getFallbackIcon()}
        />
      </div>
    </div>
  );
}
