'use client';

import { PanelLeft, LayoutGrid, Workflow, Settings2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { MetaConfigEditor } from './meta-config-editor';
import type { MetaConfig, FieldDefinition } from '@/types';

interface ToolbarProps {
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  onAutoLayout: () => void;
  metaConfig: MetaConfig;
  onUpdateMetaConfig: (type: keyof MetaConfig, fields: FieldDefinition[]) => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onExport?: () => void;
  onImport?: () => void;
}

export function Toolbar({
  onLeftSidebarToggle,
  onRightSidebarToggle,
  onAutoLayout,
  metaConfig,
  onUpdateMetaConfig,
  leftSidebarOpen,
  rightSidebarOpen,
  onExport,
  onImport,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
      {/* Left Section - Sidebar Toggles */}
      <div className="flex items-center gap-2">
        <Button
          variant={leftSidebarOpen ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3 gap-2"
          onClick={onLeftSidebarToggle}
          aria-label="Toggle outline panel"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="text-xs font-medium">Outline</span>
        </Button>
        
        <Button
          variant={rightSidebarOpen ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3 gap-2"
          onClick={onRightSidebarToggle}
          aria-label="Toggle properties panel"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="text-xs font-medium">Properties</span>
        </Button>
      </div>
      
      {/* Center Section - Actions */}
      <div className="flex items-center gap-2">

        {onImport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onImport}
            className="h-8 px-3 gap-2"
            aria-label="Import project"
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs font-medium">Import</span>
          </Button>
        )}

        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="h-8 px-3 gap-2"
            aria-label="Export project"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs font-medium">Export</span>
          </Button>
        )}

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm" 
          onClick={onAutoLayout}
          className="h-8 px-3 gap-2"
          aria-label="Auto-arrange nodes"
        >
          <Workflow className="h-4 w-4" />
          <span className="text-xs font-medium">Auto-Arrange</span>
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <MetaConfigEditor 
          config={metaConfig} 
          onUpdate={onUpdateMetaConfig} 
        />
      </div>

      {/* Right Section - Spacer */}
      <div className="w-[120px]" />
    </div>
  );
}
