'use client';

import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { IconPicker } from '@/components/common/icon-picker';
import { ExternalLink, Square, FileText, Layers, Share2 } from 'lucide-react';
import { ClearFieldButton } from '@/components/editors/meta-value-editor';

interface CommonFieldsProps {
  label: string;
  color: string;
  icon: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  shortDescription?: string;
  onShortDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  entityType: 'step' | 'deliverable' | 'group' | 'edge';
  palette?: string[];
  projectIcons?: string[];
}

/**
 * Common form fields (Label, Color, Icon) shared across all entity types.
 * Reduces duplication in the settings panel.
 * Now supports Project Palette and Project Icons.
 */
export function CommonFields({
  label,
  shortDescription,
  color,
  icon,
  onLabelChange,
  onShortDescriptionChange,
  onColorChange,
  onIconChange,
  entityType,
  palette = [],
  projectIcons = []
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
        <div className="flex items-center justify-between">
          <Label htmlFor="short-desc-input" className="font-semibold text-xs text-muted-foreground">Short Description</Label>
          {shortDescription && (
            <ClearFieldButton onClick={() => {
              const syntheticEvent = { target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>;
              onShortDescriptionChange(syntheticEvent);
            }} />
          )}
        </div>
        <textarea
          id="short-desc-input"
          value={shortDescription || ''}
          onChange={onShortDescriptionChange}
          placeholder="Enter a short description..."
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="color-input" className="font-semibold">Color</Label>
          {color && (
            <ClearFieldButton onClick={() => onColorChange('')} />
          )}
        </div>
        
        {/* Project Palette */}
        {palette.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
                {palette.map((c, i) => (
                    <button
                        key={`${c}-${i}`}
                        type="button"
                        className="w-6 h-6 rounded-md border shadow-sm ring-offset-background hover:scale-110 hover:shadow-md focus:ring-2 focus:ring-ring transition-all"
                        style={{ backgroundColor: c }}
                        onClick={() => onColorChange(c)}
                        title={c}
                    />
                ))}
            </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            id="color-input"
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="p-1 h-10 w-14 cursor-pointer"
          />
          <Input value={color} onChange={(e) => onColorChange(e.target.value)} placeholder="#RRGGBB" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">Icon</Label>
          <div className="flex items-center gap-1.5">
            {icon && (
              <ClearFieldButton onClick={() => onIconChange('')} />
            )}
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
        </div>
        <IconPicker
          value={icon}
          onChange={onIconChange}
          fallbackIcon={getFallbackIcon()}
          projectIcons={projectIcons}
        />
      </div>
    </div>
  );
}
