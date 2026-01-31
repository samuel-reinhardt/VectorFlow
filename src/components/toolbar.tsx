'use client';

import { PanelLeft, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolbarProps {
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
}

export function Toolbar({
  onLeftSidebarToggle,
  onRightSidebarToggle,
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
      <div className="flex-1" />
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
