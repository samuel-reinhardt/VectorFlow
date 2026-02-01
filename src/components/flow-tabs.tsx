import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, Copy, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/overlay/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Flow } from '@/types';

interface FlowTabsProps {
  flows: Flow[];
  activeFlowId: string;
  onSwitchFlow: (id: string) => void;
  onAddFlow: () => void;
  onUpdateFlowTitle: (id: string, title: string) => void;
  onDeleteFlow: (id: string) => void;
  onDuplicateFlow: (id: string) => void;
  onReorderFlow: (id: string, direction: 'left' | 'right') => void;
  isReadOnly?: boolean;
}

export function FlowTabs({
  flows,
  activeFlowId,
  onSwitchFlow,
  onAddFlow,
  onUpdateFlowTitle,
  onDeleteFlow,
  onDuplicateFlow,
  onReorderFlow,
  isReadOnly = false,
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
            "group relative flex items-center h-8 px-3 mr-1 rounded-t-md cursor-pointer border-t border-x border-transparent select-none transition-all duration-200 ease-in-out max-w-[200px]",
            "hover:brightness-105 active:scale-[0.98]",
            activeFlowId === flow.id
              ? "bg-background border-border text-foreground hover:bg-background shadow-[0_-2px_8px_rgba(0,0,0,0.05)]"
              : "hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onSwitchFlow(flow.id)}
          onDoubleClick={(e) => {
            if (!isReadOnly) {
              e.stopPropagation();
              startEditing(flow.id, flow.title);
            }
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

          {editingId !== flow.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "ml-1.5 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20 flex items-center justify-center",
                    activeFlowId === flow.id && "opacity-60"
                  )}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onDuplicateFlow(flow.id)}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    disabled={flows.indexOf(flow) === 0}
                    onClick={() => onReorderFlow(flow.id, 'left')}
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Move Left
                </DropdownMenuItem>
                <DropdownMenuItem 
                    disabled={flows.indexOf(flow) === flows.length - 1}
                    onClick={() => onReorderFlow(flow.id, 'right')}
                >
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                  Move Right
                </DropdownMenuItem>
                {flows.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteFlow(flow.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
      
      {!isReadOnly && (
        <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-1 shrink-0 transition-all duration-200 active:scale-90 hover:bg-muted-foreground/20"
        onClick={onAddFlow}
        title="Add new flow"
      >
        <Plus className="h-4 w-4" />
      </Button>
      )}
    </div>
  );
}
