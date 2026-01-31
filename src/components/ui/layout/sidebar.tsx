'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/layout/sheet';

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    side?: 'left' | 'right';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    isDesktop: boolean | null;
}

const Sidebar: React.FC<SidebarProps> = ({ side = 'left', className, children, open, onOpenChange, isDesktop }) => {
  if (isDesktop === null) {
    // Render a collapsed sidebar shell on server to avoid layout shift and hydration issues.
    return (
      <aside
        className={cn(
          'flex flex-col shrink-0 bg-card text-card-foreground border-border transition-all duration-200 ease-in-out',
          side === 'left' ? 'border-r' : 'border-l',
          'w-0 p-0 border-0',
          'overflow-hidden',
          className
        )}
      />
    );
  }

  if (isDesktop) {
    // Desktop view
    return (
      <aside
        className={cn(
          'flex flex-col shrink-0 bg-card text-card-foreground border-border transition-all duration-200 ease-in-out',
          side === 'left' ? 'border-r' : 'border-l',
          open ? 'w-80' : 'w-0 p-0 border-0',
          !open && 'overflow-hidden',
          className
        )}
      >
        <div className="flex flex-col w-80 h-full overflow-hidden">
            {children}
        </div>
      </aside>
    );
  } 
  
  // Mobile view using Sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn('w-80 p-0', className)}
      >
          <SheetHeader>
            <SheetTitle className="sr-only">{side === 'left' ? 'Outline' : 'Controls'} Sidebar</SheetTitle>
          </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};
Sidebar.displayName = 'Sidebar';

const SidebarHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  ({ className, ...props }) => (
    <div className={cn('p-4 border-b shrink-0', className)} {...props} />
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  ({ className, ...props }) => (
    <div className={cn('flex-1 overflow-y-auto', className)} {...props} />
);
SidebarContent.displayName = 'SidebarContent';

export { Sidebar, SidebarHeader, SidebarContent };
