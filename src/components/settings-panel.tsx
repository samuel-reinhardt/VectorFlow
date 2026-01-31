'use client';

import { useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  selectedSteps: Node[];
  selectedEdge: Edge | null;
  selectedDeliverableId?: string | null;
  onAddStep: () => void;
  onAddDeliverable: (stepId: string) => void;
  onUpdateStepLabel: (stepId: string, label: string) => void;
  onUpdateStepColor: (stepId: string, color: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeColor: (edgeId: string, color: string) => void;
  onUpdateDeliverable: (stepId: string, deliverableId: string, updates: any) => void;
  onDeleteSelection: () => void;
  onGroupSelection: () => void;
  onUngroup: () => void;
  onTitleChange: (title: string, description: string, deleteText: string) => void;
}

export function SettingsPanel({
  selectedSteps,
  selectedEdge,
  selectedDeliverableId, // New prop
  onAddStep,
  onAddDeliverable,
  onUpdateStepLabel,
  onUpdateStepColor,
  onUpdateEdgeLabel,
  onUpdateEdgeColor,
  onUpdateDeliverable, // New prop
  onDeleteSelection, // We'll rely on global deleteSelection which handles deliverable deletion now
  onGroupSelection,
  onUngroup,
  onTitleChange,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#E5E7EB');

  const singleSelectedStep = selectedSteps.length === 1 ? selectedSteps[0] : null;
  const isMultiStepSelection = selectedSteps.length > 1;
  const isGroupSelected = !!singleSelectedStep?.data.isGroup;
  
  // Find selected deliverable
  const selectedDeliverable = singleSelectedStep && selectedDeliverableId 
    ? singleSelectedStep.data.deliverables?.find((d: any) => d.id === selectedDeliverableId) 
    : null;

  const isStepSelected = singleSelectedStep && !isGroupSelected && !selectedDeliverable;

  useEffect(() => {
    if (selectedDeliverable) {
      setLabel(selectedDeliverable.label || '');
      setColor(selectedDeliverable.color || '#E0E7FF');
    } else if (singleSelectedStep) {
      setLabel(singleSelectedStep.data.label || '');
      setColor(singleSelectedStep.data.color || '#E5E7EB');
    } else if (selectedEdge) {
      setLabel(selectedEdge.label?.toString() || '');
      setColor((selectedEdge.style?.stroke as string) || '#6B7280');
    }
  }, [singleSelectedStep, selectedEdge, selectedDeliverable]);
  
  useEffect(() => {
    const getPanelInfo = () => {
      if (isMultiStepSelection) {
        return { title: 'Multiple Items', description: `${selectedSteps.length} steps selected`, deleteText: 'Delete Selection' };
      }
      if (singleSelectedStep) {
        if (isGroupSelected) return { title: 'Edit Group', description: 'Editing a group container', deleteText: 'Delete Group' };
        if (selectedDeliverable) return { title: 'Edit Deliverable', description: 'Editing a deliverable', deleteText: 'Delete Deliverable' };
        if (isStepSelected) return { title: 'Edit Step', description: 'Editing a workflow step', deleteText: 'Delete Step' };
      }
      if (selectedEdge) {
        return { title: 'Edit Connection', description: 'Editing a connection', deleteText: 'Delete Connection' };
      }
      return { title: 'Controls', description: 'Manage your graph.', deleteText: '' };
    };
    const { title, description, deleteText } = getPanelInfo();
    onTitleChange(title, description, deleteText);

  }, [selectedSteps, selectedEdge, selectedDeliverable, onTitleChange, isMultiStepSelection, singleSelectedStep, isGroupSelected, isStepSelected]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (selectedDeliverable) {
        onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { label: newLabel });
    } else if (singleSelectedStep) {
      onUpdateStepLabel(singleSelectedStep.id, newLabel);
    } else if (selectedEdge) {
      onUpdateEdgeLabel(selectedEdge.id, newLabel);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (selectedDeliverable) {
        onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { color: newColor });
    } else if (singleSelectedStep) {
      onUpdateStepColor(singleSelectedStep.id, newColor);
    } else if (selectedEdge) {
      onUpdateEdgeColor(selectedEdge.id, newColor);
    }
  };

  const editingElement = singleSelectedStep || selectedEdge;

  return (
    <div className="flex-1 overflow-y-auto p-4 pt-0">
      {editingElement && !isMultiStepSelection ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label-input" className="font-semibold">Label</Label>
            <Input
              id="label-input"
              value={label}
              onChange={handleLabelChange}
              placeholder="Enter label"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color-input" className="font-semibold">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color-input"
                type="color"
                value={color}
                onChange={handleColorChange}
                className="p-1 h-10 w-14 cursor-pointer"
              />
                <Input value={color} onChange={handleColorChange} placeholder="#RRGGBB" />
            </div>
          </div>
          
          {isStepSelected && (
            <Button onClick={() => onAddDeliverable(singleSelectedStep.id)} className="w-full">Add Deliverable</Button>
          )}

          {isGroupSelected && (
            <Button onClick={onUngroup} className="w-full">Ungroup</Button>
          )}
          
          <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {isMultiStepSelection ? (
              <>
              <p className="text-sm text-muted-foreground">You can group these steps into a single container.</p>
              <Button onClick={onGroupSelection}>Group Selection</Button>
              <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selection
              </Button>
              </>
            ) : (
              <>
              <p className="text-sm text-muted-foreground">Select an element to edit its properties, or add a new step to the canvas.</p>
              <Button onClick={onAddStep}>Add Step</Button>
              </>
            )}
        </div>
      )}
    </div>
  );
}
