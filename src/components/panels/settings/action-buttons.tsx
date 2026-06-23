'use client';

import { Button } from '@/components/ui/forms/button';
import { Plus, Trash2, Boxes } from 'lucide-react';

interface ActionButtonsProps {
  isStepSelected: boolean;
  isGroupSelected: boolean;
  onAddDeliverable?: () => void;
  onAddStepToGroup?: () => void;
  onUngroup?: () => void;
  onDeleteSelection: () => void;
}

/**
 * Action buttons section for the settings panel.
 * Shows context-specific actions based on the selected entity type.
 */
export function ActionButtons({
  isStepSelected,
  isGroupSelected,
  onAddDeliverable,
  onAddStepToGroup,
  onUngroup,
  onDeleteSelection,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      {isGroupSelected && onAddStepToGroup && (
        <Button onClick={onAddStepToGroup} className="w-full" variant="outline" size="sm">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Step
        </Button>
      )}

      {onAddDeliverable && (
        <Button onClick={onAddDeliverable} className="w-full" variant="outline" size="sm">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Deliverable
        </Button>
      )}

      {isGroupSelected && onUngroup && (
        <Button onClick={onUngroup} className="w-full" variant="outline" size="sm">
          <Boxes className="mr-2 h-3.5 w-3.5" />
          Ungroup
        </Button>
      )}
      
      <Button variant="destructive" onClick={onDeleteSelection} className="w-full" size="sm">
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete Selection
      </Button>
    </div>
  );
}
