'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CustomNode = ({ data, selected }: NodeProps<{ label: string; color: string }>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Card
        className={cn(
          'shadow-lg border-2',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent'
        )}
        style={{ backgroundColor: data.color || '#739072' }}
      >
        <CardContent className="p-3 min-w-32 text-center">
          <p className="text-primary-foreground font-medium truncate">{data.label}</p>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </>
  );
};

export default memo(CustomNode);
