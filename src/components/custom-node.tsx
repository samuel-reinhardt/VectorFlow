'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/layout/card';
import { cn, getTextColorForBackground } from '@/lib/utils';

import { Square } from 'lucide-react';
import { DynamicIcon } from './dynamic-icon';
import { DeliverableItem } from './deliverable-item';

const CustomNode = ({ id, data, selected }: NodeProps<{ 
  label: string; 
  color: string; 
  icon?: string;
  isGroup?: boolean; 
  deliverables?: any[]; 
  onSelectDeliverable?: (nodeId: string, id: string | null) => void;
  onReorderDeliverables?: (items: any[]) => void;
  selectedDeliverableId?: string | null;
}>) => {

  // Render for Step
  const textColor = getTextColorForBackground(data.color);
  const deliverables = Array.isArray(data.deliverables) ? data.deliverables : [];

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
        data.onReorderDeliverables(newDeliverables);
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
          'shadow-lg w-full flex flex-col overflow-hidden bg-card ease-in-out',
          "outline outline-none hover:outline transition-[outline] duration-200 outline-offset-1",
          selected ? "outline outline-ring hover:outline-ring/60" : "hover:outline-ring/30"
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
          <CardTitle className="text-base break-words flex items-center gap-2" style={{ color: textColor }}>
            <DynamicIcon name={data.icon} fallback={Square} className="w-4 h-4 shrink-0" />
            {data.label}
          </CardTitle>
        </CardHeader>
        
        {/* Deliverables List */}
        <CardContent className="p-2 flex flex-col gap-2 bg-background flex-grow">
            {deliverables.length > 0 ? (
                deliverables.map((item: any, index: number) => (
                  <DeliverableItem
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={data.selectedDeliverableId === item.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleDeliverableClick}
                  />
                ))
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
