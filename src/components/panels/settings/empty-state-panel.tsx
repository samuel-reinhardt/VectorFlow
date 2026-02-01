'use client';

import { Button } from '@/components/ui/forms/button';
import { Plus, Layers, Trash2 } from 'lucide-react';

interface EmptyStatePanelProps {
  isMultiStepSelection: boolean;
  selectedStepsCount: number;
  onGroupSelection?: () => void;
  onDeleteSelection?: () => void;
  onAddStep?: () => void;
}

/**
 * Empty state panel shown when no single entity is selected.
 * Shows different content for multi-selection vs no selection.
 */
export function EmptyStatePanel({
  isMultiStepSelection,
  selectedStepsCount,
  onGroupSelection,
  onDeleteSelection,
  onAddStep,
}: EmptyStatePanelProps) {
  if (isMultiStepSelection) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          You can group these {selectedStepsCount} steps into a single container.
        </p>
        {onGroupSelection && (
          <Button onClick={onGroupSelection}>
            <Layers className="mr-2 h-4 w-4" />
            Group Selection
          </Button>
        )}
        {onDeleteSelection && (
          <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selection
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Select an element to edit its properties, or add a new step to the canvas.
      </p>
      {onAddStep && (
        <Button onClick={onAddStep}>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      )}
    </div>
  );
}
