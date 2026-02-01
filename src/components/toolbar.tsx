'use client';

import { PanelLeft, LayoutGrid, Workflow, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { MetaConfigEditor } from './meta-config-editor';
import type { MetaConfig, FieldDefinition } from '@/hooks/use-vector-flow';

interface ToolbarProps {
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  onAutoLayout: () => void;
  metaConfig: MetaConfig;
  onUpdateMetaConfig: (type: keyof MetaConfig, fields: FieldDefinition[]) => void;
}

export function Toolbar({
  onLeftSidebarToggle,
  onRightSidebarToggle,
  onAutoLayout,
  metaConfig,
  onUpdateMetaConfig,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1 border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onLeftSidebarToggle}
          aria-label="Toggle outline panel"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
         <Button
          variant="ghost"
          size="sm" 
          onClick={onAutoLayout}
          className="h-8 px-2 text-xs gap-2 font-medium"
          aria-label="Auto-arrange nodes"
        >
          <Workflow className="h-4 w-4" />
          Auto-Arrange
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <MetaConfigEditor 
          config={metaConfig} 
          onUpdate={onUpdateMetaConfig} 
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRightSidebarToggle}
        className="h-8 w-8"
        aria-label="Toggle settings panel"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
