'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

const CustomNode = ({ data, selected }: NodeProps<{ label: string; color: string; isGroup?: boolean }>) => {
  const textColor = data.isGroup
    ? 'hsl(var(--foreground))'
    : getTextColorForBackground(data.color);

  return (
    <>
      {!data.isGroup && <Handle type="target" position={Position.Left} className="!bg-border !w-3 !h-3" />}
      <Card
        className={cn(
          'shadow-lg',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent',
          data.isGroup ? 'border-dashed border-2 bg-card/50' : 'border-2'
        )}
        style={data.isGroup ? { borderColor: data.color } : { backgroundColor: data.color, borderColor: 'transparent' }}
      >
        <CardContent className="p-3 text-center">
          <p className="font-medium" style={{ color: textColor }}>
            {data.label}
          </p>
        </CardContent>
      </Card>
      {!data.isGroup && <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />}
    </>
  );
};

export default memo(CustomNode);
