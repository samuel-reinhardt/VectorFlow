'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    side?: 'left' | 'right';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ side = 'left', className, children, open, onOpenChange }, ref) => {
  return (
    <>
      {/* Mobile view using Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side={side} className={cn('w-80 p-0', className)}>
             <SheetHeader className="sr-only">
                <SheetTitle>{side === 'left' ? 'Outline' : 'Controls'} Sidebar</SheetTitle>
             </SheetHeader>
            {children}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop view */}
      <aside
        ref={ref}
        className={cn(
          'hidden md:flex flex-col shrink-0 bg-card text-card-foreground border-border transition-all duration-200 ease-in-out',
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
    </>
  );
});
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-b shrink-0', className)} {...props} />
  )
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto', className)} {...props} />
  )
);
SidebarContent.displayName = 'SidebarContent';

export { Sidebar, SidebarHeader, SidebarContent };
