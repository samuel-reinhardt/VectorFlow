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
import { useUndoRedo } from './use-undo-redo';

export const useVectorFlow = (initialNodes: Node[], initialEdges: Edge[]) => {
  // --- Core State ---
  const [activeFlowId, setActiveFlowId] = useState<string>('1');
  const [projectId, setProjectId] = useState<string>(() => `project_${Date.now()}`);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  
  // Undo/Redo State Management
  const {
      state: flowState,
      setState: setFlowState,
      undo,
      redo,
      takeSnapshot,
      reset: resetFlowState,
      canUndo,
      canRedo
  } = useUndoRedo({ nodes: initialNodes, edges: initialEdges });

  const nodes = flowState.nodes;
  const edges = flowState.edges;
  
  const setNodesState = useCallback((value: Node[] | ((prev: Node[]) => Node[])) => {
      setFlowState((prevState) => ({
          ...prevState,
          nodes: typeof value === 'function' ? value(prevState.nodes) : value
      }));
  }, [setFlowState]);

  const setEdges = useCallback((value: Edge[] | ((prev: Edge[]) => Edge[])) => {
      setFlowState((prevState) => ({
          ...prevState,
          edges: typeof value === 'function' ? value(prevState.edges) : value
      }));
  }, [setFlowState]);

  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // --- Derived Selection State ---
  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);
  const selectedEdge = useMemo(() => selectedEdges.length === 1 ? selectedEdges[0] : null, [selectedEdges]);

  // --- React Flow Utilities ---
  const { getNodes, getEdges, screenToFlowPosition } = useReactFlow();

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
  
  // Wrap auto-layout to take snapshot
  const handleAutoLayoutWithSnapshot = useCallback((options:any) => {
      takeSnapshot();
      handleAutoLayout(options);
  }, [handleAutoLayout, takeSnapshot]);

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
    undefined,
    setActiveFlowId,
    setNodesState,
    setEdges,
    setSelectedDeliverableId,
    getNodes,
    getEdges
  );

  // 3. Node Operations
  const nodeOps = useNodeOperations(nodes, setNodesState);
  
  // Wrap addStep
  const addStepWithSnapshot = useCallback((position?: { x: number; y: number }) => {
      takeSnapshot();
      return nodeOps.addStep(position);
  }, [nodeOps.addStep, takeSnapshot]);

  // 4. Edge Operations
  const edgeOps = useEdgeOperations(setEdges, isReadOnly);
  
  // Wrap onConnect
  const onConnectWithSnapshot = useCallback((params:any) => {
      takeSnapshot();
      edgeOps.onConnect(params);
  }, [edgeOps.onConnect, takeSnapshot]);

  // 5. Deliverable Operations
  const deliverableOps = useDeliverableOperations(setNodesState, setSelectedDeliverableId);
  
  // Wrap addDeliverable
  const addDeliverableWithSnapshot = useCallback((stepId: string) => {
      takeSnapshot();
      return deliverableOps.addDeliverable(stepId);
  }, [deliverableOps.addDeliverable, takeSnapshot]);


  // 6. Metadata Operations
  const metadataOps = useMetadataOperations(setNodesState);

  // 7. Group Operations
  const groupOps = useGroupOperations(setNodesState, getNodes, autoResizeGroups);
  
  const groupSelectionWithSnapshot = useCallback(() => {
      takeSnapshot();
      groupOps.groupSelection();
  }, [groupOps.groupSelection, takeSnapshot]);

  const ungroupSelectionWithSnapshot = useCallback(() => {
      takeSnapshot();
      groupOps.ungroupSelection();
  }, [groupOps.ungroupSelection, takeSnapshot]);

  // 8. Selection & Deletion Management
  const selectionOps = useSelectionManagement(
    () => {}, 
    () => {}, 
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
  
  const deleteSelectionWithSnapshot = useCallback(() => {
     takeSnapshot();
     selectionOps.deleteSelection();
  }, [selectionOps.deleteSelection, takeSnapshot]);
  
  // Sync interactive canvas state back to the flows array
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
      // Create fresh state for history
      resetFlowState({
          nodes: activeFlow.nodes,
          edges: activeFlow.edges
      });
    }
  }, [setFlows, setActiveFlowId, setGoogleDriveFileId, resetFlowState]);

  const { hasLoadedFromStorage } = useFlowPersistence(
    flows,
    activeFlowId,
    projectId,
    projectName,
    googleDriveFileId,
    handleOnLoad
  );

  // Enrichment logic
  const enrichedNodes = useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onSelectDeliverable: (nodeId: string, dId: string | null) => deliverableOps.selectDeliverable(nodeId, dId),
      onReorderDeliverables: (newDels: any[]) => {
          takeSnapshot(); // Snapshot before reorder? Or maybe debounce this... for now snapshot is safer
          deliverableOps.reorderDeliverables(node.id, newDels);
      },
      selectedDeliverableId: selectedNodes.length === 1 && selectedNodes[0].id === node.id ? selectedDeliverableId : null
    }
  })), [nodes, deliverableOps.selectDeliverable, deliverableOps.reorderDeliverables, selectedNodes, selectedDeliverableId, takeSnapshot]);

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
    onConnect: onConnectWithSnapshot,
    onSelectionChange: selectionOps.onSelectionChange,
    addStep: addStepWithSnapshot,
    addDeliverable: addDeliverableWithSnapshot,
    updateStepLabel: nodeOps.updateStepLabel,
    updateStepColor: nodeOps.updateStepColor,
    updateStepIcon: nodeOps.updateStepIcon,
    updateEdgeLabel: edgeOps.updateEdgeLabel,
    updateEdgeColor: edgeOps.updateEdgeColor,
    updateEdgeIcon: edgeOps.updateEdgeIcon,
    updateDeliverable: deliverableOps.updateDeliverable,
    deleteSelection: deleteSelectionWithSnapshot,
    groupSelection: groupSelectionWithSnapshot,
    ungroupSelection: ungroupSelectionWithSnapshot,
    handleAutoLayout: handleAutoLayoutWithSnapshot,
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
    undo,
    redo,
    takeSnapshot,
    canUndo,
    canRedo,
    screenToFlowPosition
  };
};
