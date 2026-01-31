import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { cn } from '@/lib/utils';
import type { Flow } from '@/hooks/use-vector-flow';

interface FlowTabsProps {
  flows: Flow[];
  activeFlowId: string;
  onSwitchFlow: (id: string) => void;
  onAddFlow: () => void;
  onUpdateFlowTitle: (id: string, title: string) => void;
}

export function FlowTabs({
  flows,
  activeFlowId,
  onSwitchFlow,
  onAddFlow,
  onUpdateFlowTitle,
}: FlowTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdateFlowTitle(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="flex items-center h-10 bg-muted/40 border-t border-border px-1 overflow-x-auto min-h-[40px] shrink-0">
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={cn(
            "group relative flex items-center h-8 px-3 mr-1 rounded-t-md cursor-pointer border-t border-x border-transparent select-none transition-colors max-w-[200px]",
            activeFlowId === flow.id
              ? "bg-background border-border text-foreground hover:bg-background"
              : "hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onSwitchFlow(flow.id)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing(flow.id, flow.title);
          }}
        >
          {editingId === flow.id ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              className="h-6 w-full min-w-[100px] px-1 py-0 text-sm bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm font-medium truncate py-1">
              {flow.title}
            </span>
          )}
        </div>
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-1 shrink-0"
        onClick={onAddFlow}
        title="Add new flow"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
