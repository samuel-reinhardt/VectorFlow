'use client';

import { PanelLeft, LayoutGrid, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

interface ToolbarProps {
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  onAutoLayout: () => void;
}

export function Toolbar({
  onLeftSidebarToggle,
  onRightSidebarToggle,
  onAutoLayout,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1 border-b border-border bg-card shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onLeftSidebarToggle}
        aria-label="Toggle outline panel"
      >
        <PanelLeft />
      </Button>
      
      <div className="flex items-center gap-2">
         <Button
          variant="ghost"
          size="sm" 
          onClick={onAutoLayout}
          className="h-8 px-2 text-xs gap-2"
          aria-label="Auto-arrange nodes"
        >
          <Workflow className="h-4 w-4" />
          Auto-Arrange
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRightSidebarToggle}
        className="h-8 w-8"
        aria-label="Toggle settings panel"
      >
        <LayoutGrid />
      </Button>
    </div>
  );
}
