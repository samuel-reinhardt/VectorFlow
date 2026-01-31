'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: 'left' | 'right';
    collapsible?: 'icon' | 'offcanvas';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ side = 'left', collapsible = 'offcanvas', className, children, open, onOpenChange, ...props }, ref) => {

  return (
    <>
      {/* Mobile view using Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side={side} className={cn('w-80 p-0', className)}>
            {children}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop view */}
      <div
        ref={ref}
        className={cn(
          'hidden md:flex flex-col h-full bg-card text-card-foreground border-border transition-all duration-200',
          side === 'left' ? 'border-r' : 'border-l',
          collapsible === 'icon' 
            ? (open ? 'w-64' : 'w-0 border-0 p-0') // Simplified icon-collapse to just hide
            : (open ? 'w-80' : 'w-0 border-0 p-0'),
           !open && 'overflow-hidden',
          className
        )}
        {...props}
      >
        <div className="overflow-hidden flex flex-col h-full w-full">
            {children}
        </div>
      </div>
    </>
  );
});
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-b', className)} {...props} />
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
