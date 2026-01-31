'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/layout/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

const CustomNode = ({ id, data, selected }: NodeProps<{ 
  label: string; 
  color: string; 
  isGroup?: boolean; 
  deliverables?: any[]; 
  onSelectDeliverable?: (nodeId: string, id: string | null) => void;
  onReorderDeliverables?: (id: string, items: any[]) => void;
  selectedDeliverableId?: string | null;
}>) => {

  // Render for Step
  const textColor = getTextColorForBackground(data.color);
  const deliverables = data.deliverables || [];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    if (data.onReorderDeliverables) {
        const newDeliverables = [...deliverables];
        const [movedItem] = newDeliverables.splice(sourceIndex, 1);
        newDeliverables.splice(targetIndex, 0, movedItem);
        data.onReorderDeliverables(id, newDeliverables);
    }
  };

  const handleDeliverableClick = (_e: React.MouseEvent, deliverableId: string) => {
    data.onSelectDeliverable?.(id, deliverableId);
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border !w-3 !h-3 z-10" />
      <Card
        className={cn(
          'shadow-lg w-full flex flex-col overflow-hidden bg-card transition-all duration-200',
          selected ? 'ring-2 ring-ring' : ''
        )}
        style={{ borderColor: data.color, height: 'auto', minHeight: '60px' }}
      >
        <CardHeader
          className="p-3 flex-shrink-0"
          style={{ backgroundColor: data.color }}
          onClick={(e) => {
               // If clicking header, select the node but deselect specific deliverable
               // But React Flow handles node selection automatically on click.
               // We just need to clear deliverable selection if set.
               if (data.selectedDeliverableId) {
                   data.onSelectDeliverable?.(id, null);
               }
          }}
        >
          <CardTitle className="text-base break-words" style={{ color: textColor }}>
            {data.label}
          </CardTitle>
        </CardHeader>
        
        {/* Deliverables List */}
        <CardContent className="p-2 flex flex-col gap-2 bg-background flex-grow">
            {deliverables.length > 0 ? (
                deliverables.map((item: any, index: number) => {
                     const isSelected = data.selectedDeliverableId === item.id;
                     const itemTextColor = getTextColorForBackground(item.color);
                     return (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={(e) => handleDeliverableClick(e, item.id)}
                            className={cn(
                                "nodrag p-2 rounded-md text-sm font-medium cursor-grab active:cursor-grabbing border hover:brightness-95 transition-all",
                                isSelected ? "ring-2 ring-primary border-transparent" : "border-border"
                            )}
                            style={{ backgroundColor: item.color, color: itemTextColor }}
                        >
                            {item.label}
                        </div>
                     );
                })
            ) : (
                <div className="text-xs text-muted-foreground text-center py-2 italic opacity-50">
                    No deliverables
                </div>
            )}
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3 z-10" />
    </>
  );
};

export default memo(CustomNode);
