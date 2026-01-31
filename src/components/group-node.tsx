'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { cn, hexToRgba } from '@/lib/utils';

const GroupNode = ({ data, selected }: NodeProps<{ label: string; color: string }>) => {
  const borderColor = data.color || 'hsl(var(--muted-foreground) / 0.3)';
  const backgroundColor = hexToRgba(data.color || '#E5E7EB', selected ? 0.1 : 0.05);

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-200',
        selected ? 'ring-2 ring-primary/20' : ''
      )}
      style={{ 
        borderColor,
        backgroundColor 
      }}
    >
      <div className="absolute top-4 left-4">
        <span className={cn(
          "text-xs font-bold uppercase tracking-wider select-none transition-colors",
          selected ? "text-primary" : "text-muted-foreground/60"
        )}>
          {data.label}
        </span>
      </div>
    </div>
  );
};

export default memo(GroupNode);
