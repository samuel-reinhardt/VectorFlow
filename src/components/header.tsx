'use client';

import { Orbit, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAutoLayout: () => void;
}

export function Header({ onAutoLayout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border shadow-sm z-10 bg-card shrink-0">
      <div className="flex items-center gap-3">
        <Orbit className="text-primary h-8 w-8" />
        <h1 className="text-2xl font-headline font-bold">VectorFlow</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAutoLayout}>
          <Workflow className="mr-2 h-4 w-4" />
          Auto-Arrange
        </Button>
      </div>
    </header>
  );
}
