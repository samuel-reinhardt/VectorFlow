'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/layout/sheet';

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    side?: 'left' | 'right';
    label?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onToggle?: () => void;
    isDesktop: boolean | null;
}

const Sidebar: React.FC<SidebarProps> = ({ side = 'left', label, className, children, open, onOpenChange, onToggle, isDesktop }) => {
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
    // Desktop view with Vertical Tabs
    return (
      <aside
        className={cn(
          'flex shrink-0 bg-card text-card-foreground border-border transition-all duration-300 ease-in-out relative group/sidebar',
          side === 'left' ? 'border-r' : 'border-l',
          open ? 'w-80' : 'w-10', // w-10 (~40px) remains visible for the tab
          className
        )}
      >
        {/* Sidebar Content Container */}
        <div className={cn(
            "flex flex-col w-80 h-full overflow-hidden transition-all duration-300",
            !open && "opacity-0 pointer-events-none w-0"
        )}>
            {children}
        </div>

        {/* Vertical Tab Handle (Visible when collapsed or optionally on hover if we want to support that) */}
        {!open && label && (
            <button
                onClick={onToggle}
                className={cn(
                    "absolute top-0 left-0 w-10 h-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors outline-none",
                    side === 'right' && "left-0", // Sidebar is border-l, handle should be on the left edge of the sidebar div
                )}
            >
                <span 
                    className="whitespace-nowrap font-medium text-sm tracking-widest text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
                    style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)',
                        textAlign: 'center'
                    }}
                >
                    {label.toUpperCase()}
                </span>
            </button>
        )}
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
            <SheetTitle className="sr-only">{label || (side === 'left' ? 'Outline' : 'Controls')} Sidebar</SheetTitle>
          </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};
Sidebar.displayName = 'Sidebar';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

const SidebarHeader: React.FC<React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }> =
  ({ className, children, onClose, ...props }) => (
    <div className={cn('p-4 border-b shrink-0 flex items-center justify-between gap-2', className)} {...props}>
        <div className="flex-1 truncate">{children}</div>
        {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 shrink-0">
                <X className="h-4 w-4" />
            </Button>
        )}
    </div>
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  ({ className, ...props }) => (
    <div className={cn('flex-1 overflow-y-auto', className)} {...props} />
);
SidebarContent.displayName = 'SidebarContent';

export { Sidebar, SidebarHeader, SidebarContent };
