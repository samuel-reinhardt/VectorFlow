'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { cn, hexToRgba } from '@/lib/utils';
import { Layers } from 'lucide-react';
import { DynamicIcon } from '@/components/common/dynamic-icon';

import { useAutoStyle } from '@/hooks/use-auto-style';

const GroupNode = ({ data, selected }: NodeProps<{ label: string; color: string; icon?: string }>) => {
  const { color, icon } = useAutoStyle({ 
     type: 'group', 
     data, 
     explicitColor: data.color, 
     explicitIcon: data.icon 
  });

  const borderColor = color || 'hsl(var(--muted-foreground))';
  const backgroundColor = hexToRgba(color || '#E5E7EB', selected ? 0.3 : 0.1);

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-xl border-2 border-dashed ease-in-out',
        'transition-[background,outline,outline-offset,opacity] duration-300',
        "outline-none hover:outline duration-300 outline-offset-1",
        selected ? "outline outline-ring hover:outline-ring/60" : "hover:outline-ring/30"
      )}
      style={{ 
        borderColor,
        backgroundColor 
      }}
    >
      <div className="transition-colors absolute top-4 left-4 flex items-center gap-1.5 cursor-pointer">
        <DynamicIcon 
          name={icon} 
          fallback={Layers} 
          className={cn(
            "w-3.5 h-3.5 transition-colors text-primary",
          )} 
        />
        <span className={cn(
          "text-xs font-bold uppercase tracking-wider select-none transition-colors text-primary",
        )}>
          {data.label}
        </span>
      </div>
    </div>
  );
};

export default memo(GroupNode);
