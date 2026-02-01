'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { useReactFlow } from 'reactflow';
import { EMPTY_META_CONFIG } from '@/types';
import { useFlowPersistence } from './flow/use-flow-persistence';
import { useNodeOperations } from './nodes/use-node-operations';
import { useDeliverableOperations } from './deliverables/use-deliverable-operations';
import { useEdgeOperations } from './edges/use-edge-operations';
import { useFlowState } from './flow/use-flow-state';
import { useMetadataOperations } from './metadata/use-metadata-operations';
import { useNodeLayout } from './nodes/use-node-layout';
import { useGroupOperations } from './nodes/use-group-operations';
import { useSelectionManagement } from './use-selection-management';

/**
 * Main hook for VectorFlow application.
 * Orchestrates specialized hooks to manage flow state, nodes, edges, and operations.
 */
export const useVectorFlow = (initialNodes: Node[], initialEdges: Edge[]) => {
  // --- Core State ---
  const [activeFlowId, setActiveFlowId] = useState<string>('1');
  const [projectId, setProjectId] = useState<string>(() => `project_${Date.now()}`);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [nodes, setNodesState] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // --- Derived Selection State ---
  // We derive these from the main nodes/edges to ensure metadata changes (re-renders) 
  // are immediately reflected in the selection objects passed to panels.
  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);
  const selectedEdge = useMemo(() => selectedEdges.length === 1 ? selectedEdges[0] : null, [selectedEdges]);

  // --- React Flow Utilities ---
  const { getNodes, getEdges } = useReactFlow();

  // --- Initial State for Flows ---
  const initialFlows = useMemo(() => [
    {
      id: '1',
      title: 'Main Flow',
      nodes: initialNodes,
      edges: initialEdges,
      metaConfig: EMPTY_META_CONFIG
    }
  ], [initialNodes, initialEdges]);

  // --- Specialized Hooks ---
  
  // 1. Layout Hook
  const { autoResizeGroups, handleAutoLayout } = useNodeLayout(
    setNodesState,
    getNodes,
    getEdges
  );

  // 2. Flow State Hook
  const {
    flows,
    setFlows,
    switchFlow,
    addFlow,
    updateFlowTitle,
    deleteFlow,
    duplicateFlow,
    reorderFlow,
    updateMetaConfig,
    saveCurrentFlowState,
    googleDriveFileId,
    setGoogleDriveFileId
  } = useFlowState(
    initialFlows,
    activeFlowId,
    undefined, // initialGoogleDriveFileId (will be updated by persistence)
    setActiveFlowId,
    setNodesState,
    setEdges,
    setSelectedDeliverableId,
    getNodes,
    getEdges
  );

  // 3. Node Operations
  const nodeOps = useNodeOperations(nodes, setNodesState);

  // 4. Edge Operations
  const edgeOps = useEdgeOperations(setEdges, isReadOnly);

  // 5. Deliverable Operations
  const deliverableOps = useDeliverableOperations(setNodesState, setSelectedDeliverableId);

  // 6. Metadata Operations
  const metadataOps = useMetadataOperations(setNodesState);

  // 7. Group Operations
  const groupOps = useGroupOperations(setNodesState, getNodes, autoResizeGroups);

  // 8. Selection & Deletion Management
  const selectionOps = useSelectionManagement(
    () => {}, // setSelectedNodes (no longer needed in state)
    () => {}, // setSelectedEdges (no longer needed in state)
    setSelectedDeliverableId,
    setNodesState,
    setEdges,
    getNodes,
    getEdges,
    autoResizeGroups,
    deliverableOps.deleteDeliverable,
    selectedNodes,
    selectedDeliverableId
  );
  
  // Sync interactive canvas state back to the flows array
  // This ensures both persistence and export use the absolute latest state.
  useEffect(() => {
    saveCurrentFlowState();
  }, [nodes, edges, saveCurrentFlowState]);

  // 9. Persistence Hook
  const handleOnLoad = useCallback((loadedFlows: any[], loadedActiveId: string, loadedProjectId?: string, loadedProjectName?: string, loadedDriveId?: string) => {
    setFlows(loadedFlows);
    setActiveFlowId(loadedActiveId);
    if (loadedProjectId) setProjectId(loadedProjectId);
    if (loadedProjectName) setProjectName(loadedProjectName);
    if (loadedDriveId) setGoogleDriveFileId(loadedDriveId);
    
    const activeFlow = loadedFlows.find(f => f.id === loadedActiveId);
    if (activeFlow) {
      setNodesState(activeFlow.nodes);
      setEdges(activeFlow.edges);
    }
  }, [setFlows, setActiveFlowId, setGoogleDriveFileId, setNodesState, setEdges]);

  const { hasLoadedFromStorage } = useFlowPersistence(
    flows,
    activeFlowId,
    projectId,
    projectName,
    googleDriveFileId,
    handleOnLoad
  );

  // Enrichment logic to ensure callbacks are available in custom nodes
  const enrichedNodes = useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onSelectDeliverable: (nodeId: string, dId: string | null) => deliverableOps.selectDeliverable(nodeId, dId),
      onReorderDeliverables: (newDels: any[]) => deliverableOps.reorderDeliverables(node.id, newDels),
      selectedDeliverableId: selectedNodes.length === 1 && selectedNodes[0].id === node.id ? selectedDeliverableId : null
    }
  })), [nodes, deliverableOps.selectDeliverable, deliverableOps.reorderDeliverables, selectedNodes, selectedDeliverableId]);

  return {
    flows,
    activeFlowId,
    switchFlow,
    addFlow,
    updateFlowTitle,
    deleteFlow,
    duplicateFlow,
    reorderFlow,
    nodes: enrichedNodes,
    edges,
    selectedNodes,
    selectedEdges,
    selectedEdge,
    selectedDeliverableId,
    setNodes: setNodesState,
    onNodesChange: selectionOps.onNodesChange,
    onEdgesChange: selectionOps.onEdgesChange,
    onConnect: edgeOps.onConnect,
    onSelectionChange: selectionOps.onSelectionChange,
    addStep: nodeOps.addStep,
    addDeliverable: deliverableOps.addDeliverable,
    updateStepLabel: nodeOps.updateStepLabel,
    updateStepColor: nodeOps.updateStepColor,
    updateStepIcon: nodeOps.updateStepIcon,
    updateEdgeLabel: edgeOps.updateEdgeLabel,
    updateEdgeColor: edgeOps.updateEdgeColor,
    updateEdgeIcon: edgeOps.updateEdgeIcon,
    updateDeliverable: deliverableOps.updateDeliverable,
    deleteSelection: selectionOps.deleteSelection,
    groupSelection: groupOps.groupSelection,
    ungroupSelection: groupOps.ungroupSelection,
    handleAutoLayout,
    selectDeliverable: (nodeId: string, deliverableId: string | null) => deliverableOps.selectDeliverable(nodeId, deliverableId),
    metaConfig: flows.find(f => f.id === activeFlowId)?.metaConfig || EMPTY_META_CONFIG,
    updateMetaConfig,
    updateMetaData: metadataOps.updateMetaData,
    updateDeliverableMetaData: metadataOps.updateDeliverableMetaData,
    hasLoadedFromStorage,
    loadProject: handleOnLoad,
    saveCurrentFlowState,
    googleDriveFileId,
    setGoogleDriveFileId,
    projectId,
    setProjectId,
    projectName,
    setProjectName,
    isReadOnly,
    setIsReadOnly,
  };
};
