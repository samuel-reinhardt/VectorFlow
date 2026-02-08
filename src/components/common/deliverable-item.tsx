'use client';

import React from 'react';
import { cn, getTextColorForBackground } from '@/lib/utils';
import { DynamicIcon } from './dynamic-icon';
import { FileText } from 'lucide-react';

interface DeliverableItemProps {
  item: {
    id: string;
    label: string;
    color: string;
    icon?: string;
  };
  index: number;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
}

export const DeliverableItem = React.memo(({
  item,
  index,
  isSelected,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
}: DeliverableItemProps) => {
  // Determine icon color based on background (item.color) luminance.
  // If the background is dark, use light icon.
  // If the background is light, use dark icon.
  
  const getIconColor = (hexColor: string) => {
      if (!hexColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexColor)) {
          return '#000000'; // Default black for invalid/missing colors
      }
      
      let r: number, g: number, b: number;
      if (hexColor.length === 4) {
          r = parseInt(hexColor[1] + hexColor[1], 16);
          g = parseInt(hexColor[2] + hexColor[2], 16);
          b = parseInt(hexColor[3] + hexColor[3], 16);
      } else {
          r = parseInt(hexColor.slice(1, 3), 16);
          g = parseInt(hexColor.slice(3, 5), 16);
          b = parseInt(hexColor.slice(5, 7), 16);
      }

      // Calculate luminance of the BACKGROUND (item.color)
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // If background is bright, use dark icon.
      // If background is dark, use bright icon.
      return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const iconColor = getIconColor(item.color);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onClick={(e) => onClick(e, item.id)}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "nodrag p-2 rounded-md text-sm font-medium cursor-pointer flex items-center gap-2 border",
        "active:scale-[0.97] transition-[outline,scale] duration-200",
        isSelected ? "ring-2 ring-offset-1 ring-black" : "hover:ring-2 hover:ring-offset-1 hover:ring-[var(--ring-color)]/60"
      )}
      style={{ 
        backgroundColor: '#edf2f7', 
        borderColor: item.color,
        color: 'black',
        '--ring-color': item.color,
      } as React.CSSProperties}
    >
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm"
        style={{ backgroundColor: item.color }}
      >
        <DynamicIcon name={item.icon} fallback={FileText} className="w-3 h-3 shrink-0" style={{ color: iconColor }} />
      </div>
      <span className="truncate">{item.label}</span>
    </div>
  );
});

DeliverableItem.displayName = 'DeliverableItem';
