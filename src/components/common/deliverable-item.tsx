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
  const itemTextColor = getTextColorForBackground(item.color);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onClick={(e) => onClick(e, item.id)}
      className={cn(
        "nodrag p-2 rounded-md text-sm font-medium cursor-pointer flex items-center gap-2",
        "active:scale-[0.97] outline outline-none hover:outline transition-[outline,scale] duration-200 outline-offset-1",
        isSelected ? "outline outline-ring hover:outline-ring/60" : "hover:outline-ring/30"
      )}
      style={{ backgroundColor: item.color, color: itemTextColor, position: 'relative', zIndex: 40 }}
    >
      <DynamicIcon name={item.icon} fallback={FileText} className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </div>
  );
});

DeliverableItem.displayName = 'DeliverableItem';
