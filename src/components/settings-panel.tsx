'use client';

import { useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { Trash2, Plus, Square, FileText, Layers, Boxes, Share2, ExternalLink, Tags } from 'lucide-react';
import { IconPicker } from './icon-picker';
import { MetaValueEditor } from './meta-value-editor';
import { Separator } from '@/components/ui/layout/separator';

interface SettingsPanelProps {
  selectedSteps: Node[];
  selectedEdge: Edge | null;
  selectedDeliverableId?: string | null;
  onAddStep: () => void;
  onAddDeliverable: (stepId: string) => void;
  onUpdateStepLabel: (stepId: string, label: string) => void;
  onUpdateStepColor: (stepId: string, color: string) => void;
  onUpdateStepIcon: (stepId: string, icon: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeColor: (edgeId: string, color: string) => void;
  onUpdateEdgeIcon: (edgeId: string, icon: string) => void;
  onUpdateDeliverable: (stepId: string, deliverableId: string, updates: any) => void;
  onDeleteSelection: () => void;
  onGroupSelection: () => void;
  onUngroup: () => void;
  onTitleChange: (title: string, description: string, deleteText: string, type?: 'step' | 'deliverable' | 'group' | 'edge' | 'multi' | 'none', icon?: string) => void;
  metaConfig: any;
  onUpdateMetaData: (itemId: string, fieldId: string, value: any) => void;
  onUpdateDeliverableMetaData: (stepId: string, deliverableId: string, fieldId: string, value: any) => void;
}

export function SettingsPanel({
  selectedSteps,
  selectedEdge,
  selectedDeliverableId, // New prop
  onAddStep,
  onAddDeliverable,
  onUpdateStepLabel,
  onUpdateStepColor,
  onUpdateStepIcon,
  onUpdateEdgeLabel,
  onUpdateEdgeColor,
  onUpdateEdgeIcon,
  onUpdateDeliverable, // New prop
  onDeleteSelection, // We'll rely on global deleteSelection which handles deliverable deletion now
  onGroupSelection,
  onUngroup,
  onTitleChange,
  metaConfig,
  onUpdateMetaData,
  onUpdateDeliverableMetaData,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#E5E7EB');
  const [icon, setIcon] = useState('');

  const singleSelectedStep = selectedSteps.length === 1 ? selectedSteps[0] : null;
  const isMultiStepSelection = selectedSteps.length > 1;
  const isGroupSelected = singleSelectedStep?.type === 'group';
  
  // Find selected deliverable
  const selectedDeliverable = singleSelectedStep && selectedDeliverableId 
    ? (Array.isArray(singleSelectedStep.data.deliverables) 
        ? singleSelectedStep.data.deliverables.find((d: any) => d.id === selectedDeliverableId) 
        : null)
    : null;

  const isStepSelected = singleSelectedStep && !isGroupSelected && !selectedDeliverable;

  useEffect(() => {
    if (selectedDeliverable) {
      setLabel(selectedDeliverable.label || '');
      setColor(selectedDeliverable.color || '#E0E7FF');
      setIcon(selectedDeliverable.icon || '');
    } else if (singleSelectedStep) {
      setLabel(singleSelectedStep.data.label || '');
      setColor(singleSelectedStep.data.color || '#E5E7EB');
      setIcon(singleSelectedStep.data.icon || '');
    } else if (selectedEdge) {
      setLabel(selectedEdge.label?.toString() || '');
      setColor((selectedEdge.style?.stroke as string) || '#6B7280');
      setIcon(selectedEdge.data?.icon || '');
    }
  }, [singleSelectedStep, selectedEdge, selectedDeliverable]);
  
  useEffect(() => {
    const getPanelInfo = () => {
      if (isMultiStepSelection) {
        return { title: 'Multiple Items', description: `${selectedSteps.length} steps selected`, deleteText: 'Delete Selection', type: 'multi' as const };
      }
      if (singleSelectedStep) {
        if (isGroupSelected) return { title: 'Edit Group', description: 'Editing a group container', deleteText: 'Delete Group', type: 'group' as const };
        if (selectedDeliverable) return { title: 'Edit Deliverable', description: 'Editing a deliverable', deleteText: 'Delete Deliverable', type: 'deliverable' as const };
        if (isStepSelected) return { title: 'Edit Step', description: 'Editing a workflow step', deleteText: 'Delete Step', type: 'step' as const };
      }
      if (selectedEdge) {
        return { title: 'Edit Connection', description: 'Editing a connection', deleteText: 'Delete Connection', type: 'edge' as const };
      }
      return { title: 'Controls', description: 'Manage your graph.', deleteText: '', type: 'none' as const };
    };
    const { title, description, deleteText, type } = getPanelInfo();
    onTitleChange(title, description, deleteText, type, icon);

  }, [selectedSteps, selectedEdge, selectedDeliverable, onTitleChange, isMultiStepSelection, singleSelectedStep, isGroupSelected, isStepSelected, icon]);

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

  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    if (selectedDeliverable) {
        onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { icon: newIcon });
    } else if (singleSelectedStep) {
      onUpdateStepIcon(singleSelectedStep.id, newIcon);
    } else if (selectedEdge) {
      onUpdateEdgeIcon(selectedEdge.id, newIcon);
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm">Icon</Label>
              <a 
                href="https://lucide.dev/icons" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                Browse all icons
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <IconPicker
              value={icon}
              onChange={handleIconChange}
              fallbackIcon={
                selectedDeliverable ? FileText : 
                isGroupSelected ? Layers : 
                selectedEdge ? Share2 : 
                Square
              }
            />
          </div>
          
          {!selectedEdge && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Tags className="w-4 h-4" />
                  Custom Metadata
              </div>
              {selectedDeliverable ? (
                  <MetaValueEditor 
                      fields={metaConfig.deliverable} 
                      values={selectedDeliverable.meta || {}} 
                      onChange={(fieldId, value) => onUpdateDeliverableMetaData(singleSelectedStep!.id, selectedDeliverable.id, fieldId, value)}
                  />
              ) : isGroupSelected ? (
                  <MetaValueEditor 
                      fields={metaConfig.group} 
                      values={singleSelectedStep?.data.meta || {}} 
                      onChange={(fieldId, value) => onUpdateMetaData(singleSelectedStep!.id, fieldId, value)}
                  />
              ) : isStepSelected ? (
                  <MetaValueEditor 
                      fields={metaConfig.step} 
                      values={singleSelectedStep?.data.meta || {}} 
                      onChange={(fieldId, value) => onUpdateMetaData(singleSelectedStep!.id, fieldId, value)}
                  />
              ) : null}
            </div>
          )}

          <div className="pt-6 border-t flex flex-col gap-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Actions</div>
            
            {isStepSelected && (
              <Button onClick={() => onAddDeliverable(singleSelectedStep.id)} className="w-full" variant="outline" size="sm">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add Deliverable
              </Button>
            )}

            {isGroupSelected && (
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
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {isMultiStepSelection ? (
              <>
              <p className="text-sm text-muted-foreground">You can group these steps into a single container.</p>
              <Button onClick={onGroupSelection}>
                <Layers className="mr-2 h-4 w-4" />
                Group Selection
              </Button>
              <Button variant="destructive" onClick={onDeleteSelection} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selection
              </Button>
              </>
            ) : (
              <>
              <p className="text-sm text-muted-foreground">Select an element to edit its properties, or add a new step to the canvas.</p>
              <Button onClick={onAddStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
              </>
            )}
        </div>
      )}
    </div>
  );
}
