'use client';

import { useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  selectedStep: Node | null;
  selectedEdge: Edge | null;
  onAddStep: () => void;
  onUpdateStepLabel: (stepId: string, label: string) => void;
  onUpdateStepColor: (stepId: string, color: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeColor: (edgeId: string, color: string) => void;
  onDeleteSelection: () => void;
}

export function SettingsPanel({
  selectedStep,
  selectedEdge,
  onAddStep,
  onUpdateStepLabel,
  onUpdateStepColor,
  onUpdateEdgeLabel,
  onUpdateEdgeColor,
  onDeleteSelection,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#E5E7EB');

  useEffect(() => {
    if (selectedStep) {
      setLabel(selectedStep.data.label || '');
      setColor(selectedStep.data.color || '#E5E7EB');
    } else if (selectedEdge) {
      setLabel(selectedEdge.label?.toString() || '');
      setColor((selectedEdge.style?.stroke as string) || '#6B7280');
    }
  }, [selectedStep, selectedEdge]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (selectedStep) {
      onUpdateStepLabel(selectedStep.id, newLabel);
    } else if (selectedEdge) {
      onUpdateEdgeLabel(selectedEdge.id, newLabel);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (selectedStep) {
      onUpdateStepColor(selectedStep.id, newColor);
    } else if (selectedEdge) {
      onUpdateEdgeColor(selectedEdge.id, newColor);
    }
  };

  const editingElement = selectedStep || selectedEdge;

  return (
    <aside className="w-80 border-l border-border bg-card h-full">
      <div className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">{editingElement ? (selectedStep ? 'Edit Step' : 'Edit Connection') : 'Controls'}</CardTitle>
          <CardDescription>
            {editingElement
              ? `Editing selected ${selectedStep ? 'step' : 'connection'}`
              : 'Manage your graph.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {editingElement ? (
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
              <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedStep ? 'Step' : 'Connection'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Select an element to edit its properties, or add a new step to the canvas.</p>
              <Button onClick={onAddStep}>Add Step</Button>
            </div>
          )}
        </CardContent>
      </div>
    </aside>
  );
}
