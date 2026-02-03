import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { CommonFields } from './settings/common-fields';
import { MetadataSection } from './settings/metadata-section';
import { ActionButtons } from './settings/action-buttons';
import { EmptyStatePanel } from './settings/empty-state-panel';
import type { FieldDefinition } from '@/types';
import { Layers, Square, Share2, FileText } from 'lucide-react';

interface SettingsPanelProps {
  selectedSteps: Node[];
  selectedEdges: Edge[];
  selectedEdge: Edge | null; // Keep for backward compat/single edge check usage
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
  onUpdateEdgeMetaData: (edgeId: string, fieldId: string, value: any) => void;
}

const EMPTY_OBJECT = {};

// Helper to find common values across a list of items
function getCommonValues(items: any[], fields: FieldDefinition[], metadataExtractor: (item: any) => any) {
    const commonValues: Record<string, any> = {};
    if (items.length === 0) return commonValues;

    fields.forEach(field => {
        const firstVal = metadataExtractor(items[0])?.[field.id];
        // Check if all items have this same value
        const allSame = items.every(item => {
            const val = metadataExtractor(item)?.[field.id];
            // Simple equality check, deep check might be needed for arrays/objects but for primitives fine
            return val === firstVal;
        });
        if (allSame && firstVal !== undefined) {
            commonValues[field.id] = firstVal;
        }
    });
    return commonValues;
}

export function SettingsPanel({
  selectedSteps,
  selectedEdges,
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
  onUpdateEdgeMetaData,
}: SettingsPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#E5E7EB');
  const [icon, setIcon] = useState('');

  // Derived Selection State
  const singleSelectedStep = useMemo(() => 
    selectedSteps.length === 1 ? selectedSteps[0] : null
  , [selectedSteps]);

  const activeSelectedEdge = useMemo(() => 
    selectedEdges.length === 1 ? selectedEdges[0] : null
  , [selectedEdges]);

  // If we have selectedEdges passed as prop (new), use it. Fallback to computing from selectedEdge if needed?
  // VectorFlow passes selectedEdges now.

  const isGroupSelected = useMemo(() => 
    singleSelectedStep?.type === 'group'
  , [singleSelectedStep]);
  
  const selectedDeliverable = useMemo(() => {
    if (!singleSelectedStep || !selectedDeliverableId) return null;
    const deliverables = singleSelectedStep.data.deliverables;
    if (!Array.isArray(deliverables)) return null;
    return deliverables.find((d: any) => d.id === selectedDeliverableId) || null;
  }, [singleSelectedStep, selectedDeliverableId]);

  const isStepSelected = useMemo(() => 
    !!(singleSelectedStep && !isGroupSelected && !selectedDeliverable)
  , [singleSelectedStep, isGroupSelected, selectedDeliverable]);

  // Bulk Selection Categorization
  const selectionGroups = useMemo(() => {
      const steps = selectedSteps.filter(n => n.type !== 'group');
      const groups = selectedSteps.filter(n => n.type === 'group');
      const edges = selectedEdges;
      
      return { steps, groups, edges };
  }, [selectedSteps, selectedEdges]);

  const isMultiSelection = (selectedSteps.length + selectedEdges.length) > 1;
  const nothingSelected = selectedSteps.length === 0 && selectedEdges.length === 0;

  // Single Selection: Sync local state
  useEffect(() => {
    if (!isMultiSelection) {
        if (selectedDeliverable) {
            setLabel(selectedDeliverable.label || '');
            setColor(selectedDeliverable.color || '#E0E7FF');
            setIcon(selectedDeliverable.icon || '');
        } else if (singleSelectedStep) {
            setLabel(singleSelectedStep.data.label || '');
            setColor(singleSelectedStep.data.color || '#E5E7EB');
            setIcon(singleSelectedStep.data.icon || '');
        } else if (activeSelectedEdge) {
            setLabel(activeSelectedEdge.label?.toString() || '');
            setColor((activeSelectedEdge.style?.stroke as string) || '#6B7280');
            setIcon(activeSelectedEdge.data?.icon || '');
        }
    }
  }, [singleSelectedStep, activeSelectedEdge, selectedDeliverable, isMultiSelection]);
  
  // Update Panel Title
  useEffect(() => {
    const getPanelInfo = () => {
      if (nothingSelected) {
          return { title: 'Controls', description: 'Manage your graph.', deleteText: '', type: 'none' as const };
      }
      if (isMultiSelection) {
        const total = selectedSteps.length + selectedEdges.length;
        return { title: 'Bulk Edit', description: `${total} items selected`, deleteText: 'Delete Selection', type: 'multi' as const };
      }
      // Single Item Logic
      if (singleSelectedStep) {
        if (isGroupSelected) return { title: 'Edit Group', description: 'Editing a group container', deleteText: 'Delete Group', type: 'group' as const };
        if (selectedDeliverable) return { title: 'Edit Deliverable', description: 'Editing a deliverable', deleteText: 'Delete Deliverable', type: 'deliverable' as const };
        if (isStepSelected) return { title: 'Edit Step', description: 'Editing a workflow step', deleteText: 'Delete Step', type: 'step' as const };
      }
      if (activeSelectedEdge) {
        return { title: 'Edit Connection', description: 'Editing a connection', deleteText: 'Delete Connection', type: 'edge' as const };
      }
      return { title: 'Controls', description: 'Manage your graph.', deleteText: '', type: 'none' as const };
    };
    const { title, description, deleteText, type } = getPanelInfo();
    onTitleChange(title, description, deleteText, type, icon);

  }, [selectedSteps.length, selectedEdges.length, selectedDeliverable, onTitleChange, isMultiSelection, singleSelectedStep, isGroupSelected, isStepSelected, activeSelectedEdge, icon, nothingSelected]);

  // Handlers for Single Selection
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (selectedDeliverable) onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { label: newLabel });
    else if (singleSelectedStep) onUpdateStepLabel(singleSelectedStep.id, newLabel);
    else if (activeSelectedEdge) onUpdateEdgeLabel(activeSelectedEdge.id, newLabel);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedDeliverable) onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { color: newColor });
    else if (singleSelectedStep) onUpdateStepColor(singleSelectedStep.id, newColor);
    else if (activeSelectedEdge) onUpdateEdgeColor(activeSelectedEdge.id, newColor);
  };

  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    if (selectedDeliverable) onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { icon: newIcon });
    else if (singleSelectedStep) onUpdateStepIcon(singleSelectedStep.id, newIcon);
    else if (activeSelectedEdge) onUpdateEdgeIcon(activeSelectedEdge.id, newIcon);
  };

  // Logic for entity type in single selection
  const entityType = useMemo((): 'step' | 'deliverable' | 'group' | 'edge' => {
    if (selectedDeliverable) return 'deliverable';
    if (isGroupSelected) return 'group';
    if (activeSelectedEdge) return 'edge';
    return 'step';
  }, [selectedDeliverable, isGroupSelected, activeSelectedEdge]);

  // Logic for Metadata Props in Single Selection
  const metadataProps = useMemo(() => {
    if (selectedDeliverable) {
      return {
        fields: metaConfig.deliverable,
        values: selectedDeliverable.meta || EMPTY_OBJECT,
        lists: metaConfig.lists || [],
        onChange: (fieldId: string, value: any) => 
          onUpdateDeliverableMetaData(singleSelectedStep!.id, selectedDeliverable.id, fieldId, value)
      };
    }
    if (isGroupSelected) {
      return {
        fields: metaConfig.group,
        values: singleSelectedStep?.data.meta || EMPTY_OBJECT,
        lists: metaConfig.lists || [],
        onChange: (fieldId: string, value: any) => 
          onUpdateMetaData(singleSelectedStep!.id, fieldId, value)
      };
    }
    if (isStepSelected) {
      return {
        fields: metaConfig.step,
        values: singleSelectedStep?.data.meta || EMPTY_OBJECT,
        lists: metaConfig.lists || [],
        onChange: (fieldId: string, value: any) => 
          onUpdateMetaData(singleSelectedStep!.id, fieldId, value)
      };
    }
    if (activeSelectedEdge) {
        return {
            fields: metaConfig.edge || [],
            values: activeSelectedEdge?.data?.meta || EMPTY_OBJECT,
            lists: metaConfig.lists || [],
            onChange: (fieldId: string, value: any) =>
                onUpdateEdgeMetaData(activeSelectedEdge.id, fieldId, value)
        }
    }
    return null;
  }, [selectedDeliverable, isGroupSelected, isStepSelected, singleSelectedStep, activeSelectedEdge, metaConfig, onUpdateDeliverableMetaData, onUpdateMetaData, onUpdateEdgeMetaData]);


  // Rendering Logic
  if (nothingSelected) {
      return (
        <div className="flex-1 overflow-y-auto p-4 pt-0">
             <EmptyStatePanel
                isMultiStepSelection={false}
                selectedStepsCount={0}
                onAddStep={onAddStep}
            />
        </div>
      );
  }

  // --- Bulk Selection UI ---
  if (isMultiSelection) {
      return (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Steps Section */}
              {selectionGroups.steps.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                          <Square className="w-4 h-4" />
                          Steps ({selectionGroups.steps.length})
                      </div>
                      
                      {/* Common Fields for Steps */}
                      <CommonFields
                          label={selectionGroups.steps.every(n => n.data.label === selectionGroups.steps[0].data.label) ? selectionGroups.steps[0].data.label : ''}
                          color={selectionGroups.steps.every(n => n.data.color === selectionGroups.steps[0].data.color) ? selectionGroups.steps[0].data.color : '#E5E7EB'}
                          icon={selectionGroups.steps.every(n => n.data.icon === selectionGroups.steps[0].data.icon) ? selectionGroups.steps[0].data.icon : ''}
                          onLabelChange={(e) => selectionGroups.steps.forEach(n => onUpdateStepLabel(n.id, e.target.value))}
                          onColorChange={(color) => selectionGroups.steps.forEach(n => onUpdateStepColor(n.id, color))}
                          onIconChange={(icon) => selectionGroups.steps.forEach(n => onUpdateStepIcon(n.id, icon))}
                          entityType="step"
                          palette={metaConfig?.visualRules?.palette}
                          projectIcons={metaConfig?.visualRules?.icons}
                      />

                      <MetadataSection
                          fields={metaConfig.step || []}
                          values={getCommonValues(selectionGroups.steps, metaConfig.step || [], (item) => item.data.meta)}
                          lists={metaConfig.lists || []}
                          onChange={(fieldId, val) => {
                              selectionGroups.steps.forEach(node => {
                                  onUpdateMetaData(node.id, fieldId, val);
                              });
                          }}
                      />
                  </div>
              )}

              {/* Groups Section */}
              {selectionGroups.groups.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                          <Layers className="w-4 h-4" />
                          Groups ({selectionGroups.groups.length})
                      </div>

                      {/* Common Fields for Groups */}
                      <CommonFields
                          label={selectionGroups.groups.every(n => n.data.label === selectionGroups.groups[0].data.label) ? selectionGroups.groups[0].data.label : ''}
                          color={selectionGroups.groups.every(n => n.data.color === selectionGroups.groups[0].data.color) ? selectionGroups.groups[0].data.color : '#E5E7EB'}
                          icon={selectionGroups.groups.every(n => n.data.icon === selectionGroups.groups[0].data.icon) ? selectionGroups.groups[0].data.icon : ''}
                          onLabelChange={(e) => selectionGroups.groups.forEach(n => onUpdateStepLabel(n.id, e.target.value))}
                          onColorChange={(color) => selectionGroups.groups.forEach(n => onUpdateStepColor(n.id, color))}
                          onIconChange={(icon) => selectionGroups.groups.forEach(n => onUpdateStepIcon(n.id, icon))}
                          entityType="group"
                          palette={metaConfig?.visualRules?.palette}
                          projectIcons={metaConfig?.visualRules?.icons}
                      />

                      <MetadataSection
                          fields={metaConfig.group || []}
                          values={getCommonValues(selectionGroups.groups, metaConfig.group || [], (item) => item.data.meta)}
                          lists={metaConfig.lists || []}
                          onChange={(fieldId, val) => {
                              selectionGroups.groups.forEach(node => {
                                  onUpdateMetaData(node.id, fieldId, val);
                              });
                          }}
                      />
                  </div>
              )}

              {/* Edge Section */}
              {selectionGroups.edges.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                          <Share2 className="w-4 h-4" />
                          Connections ({selectionGroups.edges.length})
                      </div>

                      {/* Common Fields for Edges */}
                      <CommonFields
                          label={selectionGroups.edges.every(e => e.label === selectionGroups.edges[0].label) ? (selectionGroups.edges[0].label as string) || '' : ''}
                          color={selectionGroups.edges.every(e => e.style?.stroke === selectionGroups.edges[0].style?.stroke) ? (selectionGroups.edges[0].style?.stroke as string) || '#6B7280' : '#6B7280'}
                          icon={selectionGroups.edges.every(e => e.data?.icon === selectionGroups.edges[0].data?.icon) ? selectionGroups.edges[0].data?.icon : ''}
                          onLabelChange={(e) => selectionGroups.edges.forEach(edge => onUpdateEdgeLabel(edge.id, e.target.value))}
                          onColorChange={(color) => selectionGroups.edges.forEach(edge => onUpdateEdgeColor(edge.id, color))}
                          onIconChange={(icon) => selectionGroups.edges.forEach(edge => onUpdateEdgeIcon(edge.id, icon))}
                          entityType="edge"
                          palette={metaConfig?.visualRules?.palette}
                          projectIcons={metaConfig?.visualRules?.icons}
                      />

                      <MetadataSection
                          fields={metaConfig.edge || []}
                          values={getCommonValues(selectionGroups.edges, metaConfig.edge || [], (item) => item.data?.meta)}
                          lists={metaConfig.lists || []}
                          onChange={(fieldId, val) => {
                              selectionGroups.edges.forEach(edge => {
                                  onUpdateEdgeMetaData(edge.id, fieldId, val);
                              });
                          }}
                      />
                  </div>
              )}

              <ActionButtons
                isStepSelected={false}
                isGroupSelected={false}
                onDeleteSelection={onDeleteSelection}
              />
          </div>
      );
  }

  // --- Single Selection UI ---
  const editingElement = singleSelectedStep || activeSelectedEdge || selectedDeliverable;

  if (editingElement) {
      return (
        <div className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="space-y-4">
            <CommonFields
                label={label}
                color={color}
                icon={icon}
                onLabelChange={handleLabelChange}
                onColorChange={handleColorChange}
                onIconChange={handleIconChange}
                entityType={entityType}
                palette={metaConfig?.visualRules?.palette}
                projectIcons={metaConfig?.visualRules?.icons}
            />
            
            {metadataProps && (
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
        </div>
      );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pt-0">
        <EmptyStatePanel
            isMultiStepSelection={false}
            selectedStepsCount={0}
        />
    </div>
  );
}
