import { memo, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { cn, hexToRgba } from '@/lib/utils';
import { Layers } from 'lucide-react';
import { DynamicIcon } from '@/components/common/dynamic-icon';

import { useAutoStyle } from '@/hooks/use-auto-style';

const GroupNode = ({ data, selected }: NodeProps<{ 
  label: string; 
  color: string; 
  icon?: string; 
  shortDescription?: string;
  headerHeight?: number;
  onUpdateData?: (newData: any) => void;
}>) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const { color, icon } = useAutoStyle({ 
     type: 'group', 
     data, 
     explicitColor: data.color, 
     explicitIcon: data.icon 
  });

  useEffect(() => {
    if (!headerRef.current || !data.onUpdateData) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        // Only update if it significantly changed (to avoid loops)
        if (Math.abs((data.headerHeight || 0) - (height + 24)) > 1) {
            data.onUpdateData?.({ headerHeight: height + 24 }); // 24 = top:3 (12px equiv in units usually, but let's be safe)
        }
      }
    });

    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [data.shortDescription, data.label, data.headerHeight, data.onUpdateData]);

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
      <div 
        ref={headerRef}
        className="transition-colors absolute top-3 left-3 flex flex-col items-start gap-0 rounded-lg overflow-hidden border bg-white/50 shadow-sm backdrop-blur-sm group-hover:bg-white/80 transition-all duration-300 max-w-[320px]"
      >
        <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer">
          <DynamicIcon 
            name={icon} 
            fallback={Layers} 
            className={cn(
              "w-3.5 h-3.5 transition-colors text-primary",
            )} 
          />
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider select-none transition-colors text-primary",
          )}>
            {data.label}
          </span>
        </div>
        {data.shortDescription && (
          <div className="bg-white/90 px-2 py-1 border-t w-full">
            <p className="text-[10px] text-muted-foreground font-normal leading-tight text-left">
              {data.shortDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(GroupNode);
