'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

const CustomNode = ({ id, data, selected, type }: NodeProps<{ label: string; color: string; isGroup?: boolean; isDeliverable?: boolean }>) => {
  const { getNodes } = useReactFlow();

  const isParent = useMemo(() => getNodes().some(node => node.parentNode === id), [getNodes, id]);
  
  const textColor = data.isGroup
    ? 'hsl(var(--foreground))'
    : getTextColorForBackground(data.color);

  return (
    <div className={cn('w-full h-full', { 'relative': isParent && type === 'custom' })}>
      {!data.isGroup && !data.isDeliverable && <Handle type="target" position={Position.Left} className="!bg-border !w-3 !h-3" />}
      <Card
        className={cn(
          'shadow-lg',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent',
          data.isGroup ? 'border-dashed border-2 bg-card/50 h-full' : 'border-2',
          isParent && !data.isGroup ? 'absolute top-0 left-0 w-full' : ''
        )}
        style={data.isGroup ? { borderColor: data.color } : { backgroundColor: data.color, borderColor: 'transparent' }}
      >
        <CardContent className={cn("text-center", data.isDeliverable ? 'p-2' : 'p-3')}>
          <p className={cn("font-medium break-words", data.isDeliverable ? 'text-sm' : '')}>
            {data.label}
          </p>
        </CardContent>
      </Card>
      {!data.isGroup && !data.isDeliverable && <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />}
    </div>
  );
};

export default memo(CustomNode);
