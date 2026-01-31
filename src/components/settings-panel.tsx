'use client';

import { useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  selectedSteps: Node[];
  selectedEdge: Edge | null;
  onAddStep: () => void;
  onUpdateStepLabel: (stepId: string, label: string) => void;
  onUpdateStepColor: (stepId: string, color: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeColor: (edgeId: string, color: string) => void;
  onDeleteSelection: () => void;
  onGroupSelection: () => void;
  onUngroup: () => void;
}

export function SettingsPanel({
  selectedSteps,
  selectedEdge,
  onAddStep,
  onUpdateStepLabel,
  onUpdateStepColor,
  onUpdateEdgeLabel,
  onUpdateEdgeColor,
  onDeleteSelection,
  onGroupSelection,
  onUngroup,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#E5E7EB');

  const singleSelectedStep = selectedSteps.length === 1 ? selectedSteps[0] : null;
  const isMultiStepSelection = selectedSteps.length > 1;
  const isGroupSelected = !!singleSelectedStep?.data.isGroup;

  useEffect(() => {
    if (singleSelectedStep) {
      setLabel(singleSelectedStep.data.label || '');
      setColor(singleSelectedStep.data.color || '#E5E7EB');
    } else if (selectedEdge) {
      setLabel(selectedEdge.label?.toString() || '');
      setColor((selectedEdge.style?.stroke as string) || '#6B7280');
    }
  }, [singleSelectedStep, selectedEdge]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (singleSelectedStep) {
      onUpdateStepLabel(singleSelectedStep.id, newLabel);
    } else if (selectedEdge) {
      onUpdateEdgeLabel(selectedEdge.id, newLabel);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (singleSelectedStep) {
      onUpdateStepColor(singleSelectedStep.id, newColor);
    } else if (selectedEdge) {
      onUpdateEdgeColor(selectedEdge.id, newColor);
    }
  };
  
  const editingElement = singleSelectedStep || selectedEdge;

  return (
    <aside className="w-80 border-l border-border bg-card h-full">
      <div className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">{editingElement ? (singleSelectedStep ? 'Edit Step' : 'Edit Connection') : 'Controls'}</CardTitle>
          <CardDescription>
            {isMultiStepSelection
              ? `${selectedSteps.length} steps selected`
              : editingElement
              ? `Editing selected ${singleSelectedStep ? 'step' : 'connection'}`
              : 'Manage your graph.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {editingElement && !isMultiStepSelection ? (
            <div className="space-y-6">
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
              
              {isGroupSelected && (
                <Button onClick={onUngroup} className="w-full">Ungroup</Button>
              )}
              
              <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {singleSelectedStep ? 'Step' : 'Connection'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
               {isMultiStepSelection ? (
                 <>
                  <p className="text-sm text-muted-foreground">You can group these steps into a single container.</p>
                  <Button onClick={onGroupSelection}>Group Selection</Button>
                 </>
               ) : (
                <>
                  <p className="text-sm text-muted-foreground">Select an element to edit its properties, or add a new step to the canvas.</p>
                  <Button onClick={onAddStep}>Add Step</Button>
                </>
               )}
            </div>
          )}
        </CardContent>
      </div>
    </aside>
  );
}
