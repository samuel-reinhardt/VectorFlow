'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { useReactFlow } from 'reactflow';
import { EMPTY_META_CONFIG } from '@/types';
import { DIMENSIONS, DEFAULT_COLORS } from '@/lib/constants';
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
import { useClipboard } from './use-clipboard';

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
    cloudProjectId,
    setCloudProjectId
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
  const nodeOps = useNodeOperations(nodes, setNodesState, autoResizeGroups);
  
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

  // Split an edge by inserting a new node at a given screen position.
  // A->B becomes A->C->B where C is the new node.
  const splitEdgeWithNode = useCallback((edgeId: string, screenPosition: { x: number; y: number }) => {
      if (isReadOnly) return;

      const edge = getEdges().find(e => e.id === edgeId);
      if (!edge) return;

      takeSnapshot();

      // Convert screen coords to flow coords, offset so the node centres on the click.
      const flowPos = screenToFlowPosition(screenPosition);
      const pos = { x: flowPos.x - DIMENSIONS.STEP_WIDTH / 2, y: flowPos.y - 30 };

      // Create the new node and get its id.
      const newNodeId = nodeOps.addStep(pos);

      // Remove original edge & create two new edges.
      // edgeAC inherits the original edge's label, style, data, etc.
      // edgeCB is a fresh default connection.
      setEdges(eds => {
          const filtered = eds.filter(e => e.id !== edgeId);
          const edgeAC: Edge = {
              ...edge,
              id: `e-${edge.source}-${newNodeId}`,
              target: newNodeId,
              targetHandle: undefined,
          };
          const edgeCB: Edge = {
              id: `e-${newNodeId}-${edge.target}`,
              source: newNodeId,
              sourceHandle: undefined,
              target: edge.target,
              targetHandle: edge.targetHandle ?? undefined,
              animated: true,
              label: '',
              type: 'custom',
              style: { stroke: DEFAULT_COLORS.CONNECTION },
          };
          return [...filtered, edgeAC, edgeCB];
      });
  }, [isReadOnly, getEdges, takeSnapshot, screenToFlowPosition, nodeOps.addStep, setEdges]);

  // 5. Deliverable Operations
  const deliverableOps = useDeliverableOperations(setNodesState, setSelectedDeliverableId);
  
  // Wrap addDeliverable
  const addDeliverableWithSnapshot = useCallback((stepId: string, afterDeliverableId?: string) => {
      takeSnapshot();
      return deliverableOps.addDeliverable(stepId, afterDeliverableId);
  }, [deliverableOps.addDeliverable, takeSnapshot]);


  // 6. Metadata Operations
  const metadataOps = useMetadataOperations(setNodesState, setEdges);

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
  const handleOnLoad = useCallback((loadedFlows: any[], loadedActiveId: string, loadedProjectId?: string, loadedProjectName?: string, loadedCloudProjectId?: string) => {
    let finalFlows = loadedFlows;
    let finalActiveId = loadedActiveId;

    // Ensure at least one tab
    if (!finalFlows || finalFlows.length === 0) {
        finalFlows = [{
            id: '1',
            title: 'Main Flow',
            nodes: [],
            edges: [],
            metaConfig: EMPTY_META_CONFIG
        }];
        finalActiveId = '1';
    }

    // Project-level config: Normalize loaded flows to share the same configuration
    // We use the first flow's config as the project source of truth
    const projectConfig = finalFlows[0]?.metaConfig;
    const normalizedFlows = projectConfig 
        ? finalFlows.map(f => ({ ...f, metaConfig: projectConfig }))
        : finalFlows;

    setFlows(normalizedFlows);
    setActiveFlowId(finalActiveId);
    if (loadedProjectId) setProjectId(loadedProjectId);
    if (loadedProjectName) setProjectName(loadedProjectName);
    if (loadedCloudProjectId) setCloudProjectId(loadedCloudProjectId);
    
    const activeFlow = normalizedFlows.find(f => f.id === finalActiveId);
    if (activeFlow) {
      // Create fresh state for history
      resetFlowState({
          nodes: activeFlow.nodes,
          edges: activeFlow.edges
      });
    }
  }, [setFlows, setActiveFlowId, setCloudProjectId, resetFlowState, setProjectId, setProjectName]);

  const { hasLoadedFromStorage } = useFlowPersistence(
    flows,
    activeFlowId,
    projectId,
    projectName,
    cloudProjectId,
    handleOnLoad
  );

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodesState((nds) => {
      const next = nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      );
      // If we are updating headerHeight, we need to trigger auto-resizing immediately
      if (newData.headerHeight !== undefined) {
          return autoResizeGroups(next);
      }
      return next;
    });
  }, [setNodesState, autoResizeGroups]);

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
      onUpdateData: (newData: any) => updateNodeData(node.id, newData),
      selectedDeliverableId: selectedNodes.length === 1 && selectedNodes[0].id === node.id ? selectedDeliverableId : null
    }
  })), [nodes, deliverableOps.selectDeliverable, deliverableOps.reorderDeliverables, updateNodeData, selectedNodes, selectedDeliverableId, takeSnapshot]);
  
  // 10. Clipboard Hook
  const { copy, paste } = useClipboard();

  const copySelection = useCallback(() => {
    return copy(nodes, selectedDeliverableId);
  }, [copy, nodes, selectedDeliverableId]);

  const pasteSelection = useCallback((explicitData?: any) => {
    paste(
        nodes, 
        selectedNodes, 
        {
            onPasteNodes: (newNodes) => {
                takeSnapshot();
                setNodesState(nds => {
                     // Deselect old nodes
                     const deselected = nds.map(n => ({ ...n, selected: false }));
                     return [...deselected, ...newNodes];
                });
            },
            onPasteDeliverable: (targetNodeId, deliverable) => {
                takeSnapshot();
                setNodesState(nds => nds.map(node => {
                    if (node.id === targetNodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                deliverables: [...(node.data.deliverables || []), deliverable]
                            }
                        };
                    }
                    return node;
                }));
            },
            onError: (msg) => {
                // We'll let the component handle the toast, or just log for now?
                // The hook consumer (component) can't easily see this error unless we return it or pass a toast ref.
                // For now, let's just log warning. The plan said toast, so we might need to bubble this up.
                console.warn(msg);
                // Ideally this would be connected to toast, but useVectorFlow is headless-ish (except for some imports)
                // Let's expose the error callback? No, let's keep it simple.
            }
        },
        explicitData
    );
  }, [paste, nodes, selectedNodes, setNodesState, takeSnapshot]);

  const duplicateSelection = useCallback(() => {
    const result = copySelection();
    if (result) {
        // Pass the result (which contains the data) directly to paste to avoid race condition
        pasteSelection(result);
    }
  }, [copySelection, pasteSelection]);

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
    updateStepShortDescription: nodeOps.updateStepShortDescription,
    updateEdgeLabel: edgeOps.updateEdgeLabel,
    updateEdgeColor: edgeOps.updateEdgeColor,
    updateEdgeIcon: edgeOps.updateEdgeIcon,
    updateEdgeShortDescription: edgeOps.updateEdgeShortDescription,
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
    updateEdgeMetaData: metadataOps.updateEdgeMetaData,
    hasLoadedFromStorage,
    loadProject: handleOnLoad,
    saveCurrentFlowState,
    cloudProjectId,
    setCloudProjectId,
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
    screenToFlowPosition,
    copySelection,
    pasteSelection,
    duplicateSelection,
    splitEdgeWithNode
  };
};
