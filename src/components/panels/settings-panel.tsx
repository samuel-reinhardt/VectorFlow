import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { CommonFields } from './settings/common-fields';
import { MetadataSection } from './settings/metadata-section';
import { ActionButtons } from './settings/action-buttons';
import { EmptyStatePanel } from './settings/empty-state-panel';
import type { FieldDefinition } from '@/types';
import { Layers, Square, Share2, FileText, LayoutGrid, Boxes } from 'lucide-react';
import { DEFAULT_COLORS } from '@/lib/constants';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { SidebarHeader } from '@/components/ui/layout/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/layout/tabs';

const EMPTY_OBJECT = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the shared value for a given property across all `items`, or a
 * fallback when the values differ. Uses a key extractor so it works for both
 * node data properties and edge style/data properties.
 */
function getBulkValue<T, V>(
  items: T[],
  extractor: (item: T) => V | undefined | null,
  fallback: V,
): V {
  if (items.length === 0) return fallback;
  const first = extractor(items[0]);
  const allSame = items.every((item) => extractor(item) === first);
  return allSame && first !== undefined && first !== null ? first : fallback;
}

/** Renders a consistent section heading inside the multi-select panel. */
function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
}

/** Returns common metadata values across a list of items (used for bulk edits). */
function getCommonValues(items: any[], fields: FieldDefinition[], metadataExtractor: (item: any) => any) {
    const commonValues: Record<string, any> = {};
    if (items.length === 0) return commonValues;

    fields.forEach(field => {
        const firstVal = metadataExtractor(items[0])?.[field.id];
        const allSame = items.every(item => {
            const val = metadataExtractor(item)?.[field.id];
            return val === firstVal;
        });
        if (allSame && firstVal !== undefined) {
            commonValues[field.id] = firstVal;
        }
    });
    return commonValues;
}

interface SettingsPanelProps {
  selectedSteps: Node[];
  selectedEdges: Edge[];
  selectedEdge: Edge | null;
  selectedDeliverableId?: string | null;
  onAddStep: (position?: { x: number; y: number }, parentId?: string) => void;
  onAddDeliverable: (stepId: string, afterDeliverableId?: string) => void;
  onUpdateStepLabel: (stepId: string, label: string) => void;
  onUpdateStepShortDescription: (stepId: string, description: string) => void;
  onUpdateStepColor: (stepId: string, color: string) => void;
  onUpdateStepIcon: (stepId: string, icon: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeShortDescription: (edgeId: string, description: string) => void;
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
  onToggle?: () => void;
}

export function SettingsPanel({
  selectedSteps,
  selectedEdges,
  selectedEdge,
  selectedDeliverableId,
  onAddStep,
  onAddDeliverable,
  onUpdateStepLabel,
  onUpdateStepShortDescription,
  onUpdateStepColor,
  onUpdateStepIcon,
  onUpdateEdgeLabel,
  onUpdateEdgeShortDescription,
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
  onToggle,
}: SettingsPanelProps) {
  // ... (keep state and hooks the same)
  const [label, setLabel] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_COLORS.STEP);
  const [icon, setIcon] = useState('');

  // Derived Selection State
  const singleSelectedStep = useMemo(() => 
    selectedSteps.length === 1 ? selectedSteps[0] : null
  , [selectedSteps]);

  const activeSelectedEdge = useMemo(() => 
    selectedEdges.length === 1 ? selectedEdges[0] : null
  , [selectedEdges]);

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
            setShortDescription(selectedDeliverable.shortDescription || '');
            setColor(selectedDeliverable.color || '#E0E7FF');
            setIcon(selectedDeliverable.icon || '');
        } else if (singleSelectedStep) {
            setLabel(singleSelectedStep.data.label || '');
            setShortDescription(singleSelectedStep.data.shortDescription || '');
            setColor(singleSelectedStep.data.color || DEFAULT_COLORS.STEP);
            setIcon(singleSelectedStep.data.icon || '');
        } else if (activeSelectedEdge) {
            setLabel(activeSelectedEdge.label?.toString() || '');
            setShortDescription(activeSelectedEdge.data?.shortDescription || '');
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

  const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDesc = e.target.value;
    setShortDescription(newDesc);
    if (selectedDeliverable) {
        onUpdateDeliverable(singleSelectedStep!.id, selectedDeliverable.id, { shortDescription: newDesc });
    } else if (singleSelectedStep) {
        (onUpdateStepShortDescription as any)?.(singleSelectedStep.id, newDesc);
    } else if (activeSelectedEdge) {
        (onUpdateEdgeShortDescription as any)?.(activeSelectedEdge.id, newDesc);
    }
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
  // Derived Header Info
  const headerInfo = useMemo(() => {
    if (nothingSelected) return { title: 'Controls', description: '', iconName: '' };
    
    if (isMultiSelection) {
      const total = selectedSteps.length + selectedEdges.length;
      return { 
        title: 'Bulk Selection', 
        description: `${total} items selected`, 
        iconName: 'Boxes' 
      };
    }
    
    if (singleSelectedStep) {
      if (isGroupSelected) return { title: label || 'Untitled Group', description: 'Group', iconName: icon || 'Layers' };
      if (selectedDeliverable) return { title: label || 'Untitled Deliverable', description: 'Deliverable', iconName: icon || 'FileText' };
      return { title: label || 'Untitled Step', description: 'Step', iconName: icon || 'Square' };
    }
    
    if (activeSelectedEdge) {
      return { title: label || 'Connection', description: 'Connection', iconName: icon || 'Share2' };
    }
    
    return { title: 'Controls', description: '', iconName: '' };
  }, [nothingSelected, isMultiSelection, selectedSteps.length, selectedEdges.length, singleSelectedStep, isGroupSelected, selectedDeliverable, label, icon, activeSelectedEdge]);

  if (nothingSelected) {
      return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <SidebarHeader onClose={onToggle}>
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Controls</span>
              </div>
            </SidebarHeader>
            <div className="flex-1 overflow-y-auto p-4">
                 <EmptyStatePanel
                    isMultiStepSelection={false}
                    selectedStepsCount={0}
                    onAddStep={onAddStep}
                />
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
        <SidebarHeader onClose={onToggle}>
            <div className="flex items-center gap-2.5">
                {headerInfo.iconName && (
                  <div className="p-1.5 rounded-md bg-muted/50 border shrink-0">
                    <DynamicIcon name={headerInfo.iconName} fallback={LayoutGrid} className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-semibold truncate leading-none mb-1" title={headerInfo.title}>
                        {headerInfo.title}
                    </h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold leading-none">
                        {headerInfo.description}
                    </p>
                </div>
            </div>
        </SidebarHeader>
        
        <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="properties" className="w-full flex flex-col h-full">
                <div className="sticky top-0 bg-background z-20 px-4 pt-2 pb-4 border-b shrink-0">
                    <TabsList className="w-full">
                        <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
                        <TabsTrigger value="data" className="flex-1">Data</TabsTrigger>
                    </TabsList>
                </div>
                
                <div className="p-4 pt-2 flex-1">
                    <TabsContent value="properties" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 m-0">
                    {isMultiSelection ? (
                        <div className="space-y-6">
                            {selectionGroups.steps.length > 0 && (
                                <div className="space-y-3">
                                    <SectionHeader icon={Square} label={`Steps (${selectionGroups.steps.length})`} />
                                    <CommonFields
                                        label={getBulkValue(selectionGroups.steps, n => n.data.label, '')}
                                        shortDescription={getBulkValue(selectionGroups.steps, n => n.data.shortDescription, '')}
                                        color={getBulkValue(selectionGroups.steps, n => n.data.color, DEFAULT_COLORS.STEP)}
                                        icon={getBulkValue(selectionGroups.steps, n => n.data.icon, '')}
                                        onLabelChange={(e) => selectionGroups.steps.forEach(n => onUpdateStepLabel(n.id, e.target.value))}
                                        onShortDescriptionChange={(e) => selectionGroups.steps.forEach(n => onUpdateStepShortDescription(n.id, e.target.value))}
                                        onColorChange={(color) => selectionGroups.steps.forEach(n => onUpdateStepColor(n.id, color))}
                                        onIconChange={(icon) => selectionGroups.steps.forEach(n => onUpdateStepIcon(n.id, icon))}
                                        entityType="step"
                                        palette={metaConfig?.visualRules?.palette}
                                        projectIcons={metaConfig?.visualRules?.icons}
                                    />
                                </div>
                            )}

                            {selectionGroups.groups.length > 0 && (
                                <div className="space-y-3">
                                    <SectionHeader icon={Layers} label={`Groups (${selectionGroups.groups.length})`} />
                                    <CommonFields
                                        label={getBulkValue(selectionGroups.groups, n => n.data.label, '')}
                                        shortDescription={getBulkValue(selectionGroups.groups, n => n.data.shortDescription, '')}
                                        color={getBulkValue(selectionGroups.groups, n => n.data.color, DEFAULT_COLORS.STEP)}
                                        icon={getBulkValue(selectionGroups.groups, n => n.data.icon, '')}
                                        onLabelChange={(e) => selectionGroups.groups.forEach(n => onUpdateStepLabel(n.id, e.target.value))}
                                        onShortDescriptionChange={(e) => selectionGroups.groups.forEach(n => onUpdateStepShortDescription(n.id, e.target.value))}
                                        onColorChange={(color) => selectionGroups.groups.forEach(n => onUpdateStepColor(n.id, color))}
                                        onIconChange={(icon) => selectionGroups.groups.forEach(n => onUpdateStepIcon(n.id, icon))}
                                        entityType="group"
                                        palette={metaConfig?.visualRules?.palette}
                                        projectIcons={metaConfig?.visualRules?.icons}
                                    />
                                </div>
                            )}

                            {selectionGroups.edges.length > 0 && (
                                <div className="space-y-3">
                                    <SectionHeader icon={Share2} label={`Connections (${selectionGroups.edges.length})`} />
                                    <CommonFields
                                        label={getBulkValue(selectionGroups.edges, e => e.label as string | undefined, '')}
                                        shortDescription={getBulkValue(selectionGroups.edges, e => e.data?.shortDescription, '')}
                                        color={getBulkValue(selectionGroups.edges, e => e.style?.stroke as string | undefined, '#6B7280')}
                                        icon={getBulkValue(selectionGroups.edges, e => e.data?.icon, '')}
                                        onLabelChange={(e) => selectionGroups.edges.forEach(edge => onUpdateEdgeLabel(edge.id, e.target.value))}
                                        onShortDescriptionChange={(e) => selectionGroups.edges.forEach(edge => onUpdateEdgeShortDescription(edge.id, e.target.value))}
                                        onColorChange={(color) => selectionGroups.edges.forEach(edge => onUpdateEdgeColor(edge.id, color))}
                                        onIconChange={(icon) => selectionGroups.edges.forEach(edge => onUpdateEdgeIcon(edge.id, icon))}
                                        entityType="edge"
                                        palette={metaConfig?.visualRules?.palette}
                                        projectIcons={metaConfig?.visualRules?.icons}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <CommonFields
                            label={label}
                            shortDescription={shortDescription}
                            color={color}
                            icon={icon}
                            onLabelChange={handleLabelChange}
                            onShortDescriptionChange={handleShortDescriptionChange}
                            onColorChange={handleColorChange}
                            onIconChange={handleIconChange}
                            entityType={entityType}
                            palette={metaConfig?.visualRules?.palette}
                            projectIcons={metaConfig?.visualRules?.icons}
                        />
                    )}
                </TabsContent>

                <TabsContent value="data" className="focus-visible:outline-none focus-visible:ring-0">
                    {isMultiSelection ? (
                        <div className="space-y-6">
                            {selectionGroups.steps.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Step Metadata</div>
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
                            {selectionGroups.groups.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Group Metadata</div>
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
                            {selectionGroups.edges.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Connection Metadata</div>
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
                        </div>
                    ) : (
                        metadataProps ? (
                            <MetadataSection {...metadataProps} />
                        ) : (
                            <div className="py-12 text-center text-muted-foreground text-sm italic">
                                No metadata defined for this element type.
                            </div>
                        )
                    )}
                </TabsContent>
                </div>
            </Tabs>
        </div>

        <div className="p-4 border-t bg-card shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <ActionButtons
                isStepSelected={!!isStepSelected}
                isGroupSelected={!!isGroupSelected}
                onAddStepToGroup={
                  isGroupSelected && singleSelectedStep
                    ? () => onAddStep(undefined, singleSelectedStep.id)
                    : undefined
                }
                onAddDeliverable={
                  isStepSelected 
                    ? () => onAddDeliverable(singleSelectedStep!.id)
                    : selectedDeliverable 
                      ? () => onAddDeliverable(singleSelectedStep!.id, selectedDeliverable.id)
                      : undefined
                }
                onUngroup={isGroupSelected ? onUngroup : undefined}
                onDeleteSelection={onDeleteSelection}
            />
        </div>
    </div>
  );
}
