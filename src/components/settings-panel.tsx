'use client';

import { useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { CommonFields } from './panels/settings/common-fields';
import { MetadataSection } from './panels/settings/metadata-section';
import { ActionButtons } from './panels/settings/action-buttons';
import { EmptyStatePanel } from './panels/settings/empty-state-panel';

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
  selectedDeliverableId,
  onAddStep,
  onAddDeliverable,
  onUpdateStepLabel,
  onUpdateStepColor,
  onUpdateStepIcon,
  onUpdateEdgeLabel,
  onUpdateEdgeColor,
  onUpdateEdgeIcon,
  onUpdateDeliverable,
  onDeleteSelection,
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

  // Sync local state with selected entity
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
  
  // Update panel title based on selection
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

  // Determine entity type for CommonFields
  const getEntityType = (): 'step' | 'deliverable' | 'group' | 'edge' => {
    if (selectedDeliverable) return 'deliverable';
    if (isGroupSelected) return 'group';
    if (selectedEdge) return 'edge';
    return 'step';
  };

  // Get metadata fields and values based on selection
  const getMetadataProps = () => {
    if (selectedDeliverable) {
      return {
        fields: metaConfig.deliverable,
        values: selectedDeliverable.meta || {},
        onChange: (fieldId: string, value: any) => 
          onUpdateDeliverableMetaData(singleSelectedStep!.id, selectedDeliverable.id, fieldId, value)
      };
    }
    if (isGroupSelected) {
      return {
        fields: metaConfig.group,
        values: singleSelectedStep?.data.meta || {},
        onChange: (fieldId: string, value: any) => 
          onUpdateMetaData(singleSelectedStep!.id, fieldId, value)
      };
    }
    if (isStepSelected) {
      return {
        fields: metaConfig.step,
        values: singleSelectedStep?.data.meta || {},
        onChange: (fieldId: string, value: any) => 
          onUpdateMetaData(singleSelectedStep!.id, fieldId, value)
      };
    }
    return null;
  };

  const metadataProps = getMetadataProps();

  return (
    <div className="flex-1 overflow-y-auto p-4 pt-0">
      {editingElement && !isMultiStepSelection ? (
        <div className="space-y-4">
          <CommonFields
            label={label}
            color={color}
            icon={icon}
            onLabelChange={handleLabelChange}
            onColorChange={handleColorChange}
            onIconChange={handleIconChange}
            entityType={getEntityType()}
          />
          
          {!selectedEdge && metadataProps && (
            <MetadataSection {...metadataProps} />
          )}

          <ActionButtons
            isStepSelected={!!isStepSelected}
            isGroupSelected={!!isGroupSelected}
            onAddDeliverable={isStepSelected ? () => onAddDeliverable(singleSelectedStep!.id) : undefined}
            onUngroup={isGroupSelected ? onUngroup : undefined}
            onDeleteSelection={onDeleteSelection}
          />
        </div>
      ) : (
        <EmptyStatePanel
          isMultiStepSelection={isMultiStepSelection}
          selectedStepsCount={selectedSteps.length}
          onGroupSelection={isMultiStepSelection ? onGroupSelection : undefined}
          onDeleteSelection={isMultiStepSelection ? onDeleteSelection : undefined}
          onAddStep={!isMultiStepSelection ? onAddStep : undefined}
        />
      )}
    </div>
  );
}
