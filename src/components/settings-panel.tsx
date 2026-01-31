'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsPanelProps {
  selectedNode: Node | null;
  onAddNode: () => void;
  onUpdateLabel: (nodeId: string, label: string) => void;
  onUpdateColor: (nodeId: string, color: string) => void;
}

export function SettingsPanel({
  selectedNode,
  onAddNode,
  onUpdateLabel,
  onUpdateColor,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#739072');
  const [isPending, startTransition] = useTransition();


  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setColor(selectedNode.data.color || '#739072');
    }
  }, [selectedNode]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNode) {
      const newLabel = e.target.value;
      setLabel(newLabel);
      startTransition(() => {
        onUpdateLabel(selectedNode.id, newLabel);
      });
    }
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNode) {
      const newColor = e.target.value;
      setColor(newColor);
       startTransition(() => {
        onUpdateColor(selectedNode.id, newColor);
      });
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card/50 p-4 overflow-y-auto hidden md:block">
      <div className="h-full">
        <CardHeader>
          <CardTitle className="font-headline">{selectedNode ? 'Edit Node' : 'Controls'}</CardTitle>
          <CardDescription>
            {selectedNode
              ? `Editing: "${selectedNode.data.label}"`
              : 'Manage your graph.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="label-input" className="font-semibold">Label</Label>
                <Input
                  id="label-input"
                  value={label}
                  onChange={handleLabelChange}
                  placeholder="Enter node label"
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
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Select a node to edit its properties, or add a new node to the canvas.</p>
              <Button onClick={onAddNode}>Add Node</Button>
            </div>
          )}
        </CardContent>
      </div>
    </aside>
  );
}
