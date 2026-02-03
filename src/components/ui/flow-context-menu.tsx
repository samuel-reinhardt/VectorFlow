import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Copy, 
  Trash2, 
  Scissors, 
  ClipboardPaste, 
  Group, 
  Ungroup,
  MousePointer2,
  CopyPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContextMenuAction {
  label: string;
  icon?: React.ElementType;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function FlowContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Close on outside click is handled by the parent overlay or global listener usually,
  // but let's add a global click listener just in case to be safe.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Use capture to ensure we catch it before other handlers might stop propagation if needed
    // or just standard bubbling.
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Adjust position to keep in viewport
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = x - rect.width;
      }
      if (y + rect.height > viewportHeight) {
        newY = y - rect.height;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  if (actions.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      style={{ left: position.x, top: position.y }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (!action.disabled) {
                action.action();
                onClose();
            }
          }}
          disabled={action.disabled}
          className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            action.destructive && "text-destructive focus:text-destructive-foreground hover:bg-destructive/10"
          )}
        >
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          <span className="flex-1 text-left">{action.label}</span>
          {action.shortcut && (
             <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-60">
                {action.shortcut}
             </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
}
