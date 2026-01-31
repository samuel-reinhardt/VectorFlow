'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

const CustomNode = ({ id, data, selected }: NodeProps<{ label: string; color: string; isGroup?: boolean; isDeliverable?: boolean }>) => {

  // Render for Deliverable
  if (data.isDeliverable) {
    const textColor = getTextColorForBackground(data.color);
    return (
      <Card
        className={cn(
          'shadow-sm w-full h-full flex items-center justify-center',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent'
        )}
        style={{ backgroundColor: data.color, borderColor: 'transparent' }}
      >
        <CardContent className="p-2">
          <p className="text-sm font-medium break-words text-center" style={{ color: textColor }}>
            {data.label}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render for Group
  if (data.isGroup) {
    return (
      <Card
        className={cn(
          'shadow-lg w-full h-full border-dashed border-2 bg-card/50 p-3',
          selected ? 'border-primary ring-2 ring-ring' : 'border-transparent'
        )}
        style={{ borderColor: data.color }}
      >
        <p className="font-medium break-words">{data.label}</p>
      </Card>
    );
  }

  // Render for Step
  const textColor = getTextColorForBackground(data.color);
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border !w-3 !h-3 z-10" />
      <Card
        className={cn(
          'shadow-lg w-full h-full flex flex-col overflow-hidden bg-card',
          selected ? 'ring-2 ring-ring' : ''
        )}
        style={{ borderColor: data.color }}
      >
        <CardHeader
          className="p-3 flex-shrink-0"
          style={{ backgroundColor: data.color }}
        >
          <CardTitle className="text-base break-words" style={{ color: textColor }}>
            {data.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow" />
      </Card>
      <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3 z-10" />
    </>
  );
};

export default memo(CustomNode);
