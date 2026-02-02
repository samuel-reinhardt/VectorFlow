'use client';

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { Share2 } from 'lucide-react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isLabelHovered, setIsLabelHovered] = React.useState(false);

  const edgeStyle = React.useMemo(() => {
    const originalStroke = (style.stroke as string) || 'hsl(var(--muted-foreground) / 0.5)';
    
    return {
      ...style,
      strokeWidth: selected ? 5 : 2,
      stroke: originalStroke,
      strokeDasharray: '5 5',
      animation: 'dashdraw 0.5s linear infinite',
      transition: 'stroke-width 0.2s ease-in-out',
    };
  }, [style, selected]);

  return (
    <>
      <style>{`
        @keyframes dashdraw {
          from { stroke-dashoffset: 10; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={edgeStyle}
        interactionWidth={30}
      />
      {(label || data?.icon) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              borderColor: selected ? (style.stroke as string) || 'hsl(var(--border))' : (style.stroke as string) || 'inherit',
              backgroundColor: 'white',
              zIndex: 15,
            }}
            onMouseEnter={() => setIsLabelHovered(true)}
            onMouseLeave={() => setIsLabelHovered(false)}
            className={cn(
              "nodrag nopan flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm text-xs font-medium cursor-pointer bg-white",
              "active:scale-[0.97] outline outline-none hover:outline transition-[outline,scale] duration-200 outline-offset-1",
              selected ? "outline outline-ring hover:outline-ring/60" : "hover:outline-ring/30"
            )}
          >
            {data?.icon && (
               <DynamicIcon 
                name={data.icon} 
                fallback={Share2} 
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  selected ? "text-primary opacity-100" : "text-muted-foreground opacity-70"
                )} 
               />
            )}
            {label && <span className={selected ? "text-primary" : ""}>{label}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
