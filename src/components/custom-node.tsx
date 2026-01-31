'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

const CustomNode = ({ data, selected }: NodeProps<{ label: string; color: string }>) => {
  const textColor = getTextColorForBackground(data.color);
  
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border !w-3 !h-3" />
      <Card
        className={cn(
          'shadow-lg border-2',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent'
        )}
        style={{ backgroundColor: data.color || '#E5E7EB' }}
      >
        <CardContent className="p-3 min-w-32 text-center">
          <p className="font-medium truncate" style={{ color: textColor }}>{data.label}</p>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />
    </>
  );
};

export default memo(CustomNode);
