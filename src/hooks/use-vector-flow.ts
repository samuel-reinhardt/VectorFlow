'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Node,
  Edge,
  OnConnect,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';
import { useToast } from '@/hooks/use-toast';
import { StorageManager } from '@/lib/storage';
import { Deliverable, Flow, MetaConfig, FieldDefinition, EMPTY_META_CONFIG } from '@/types';
import { DIMENSIONS, DEFAULT_COLORS } from '@/lib/constants';

const { 
  STEP_WIDTH, 
  STEP_INITIAL_HEIGHT, 
  STEP_HEADER_HEIGHT, 
  DELIVERABLE_HEIGHT, 
  DELIVERABLE_Y_PADDING, 
  DELIVERABLE_X_PADDING, 
  DELIVERABLE_WIDTH 
} = DIMENSIONS;

export const useVectorFlow = (initialNodes: Node[], initialEdges: Edge[]) => {
  const [flows, setFlows] = useState<Flow[]>([
    { 
      id: '1', 
      title: 'Main Project', 
      nodes: initialNodes, 
      edges: initialEdges,
      metaConfig: {
        ...EMPTY_META_CONFIG,
        step: [
          { id: 'status', label: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] },
          { id: 'due_date', label: 'Due Date', type: 'date' }
        ]
      }
    },
    { 
      id: '2', 
      title: 'Legacy Flow', 
      nodes: [
        { 
          id: 'legacy-1', 
          type: 'custom', 
          position: { x: 100, y: 100 }, 
          data: { label: 'Legacy Core', color: '#94A3B8', icon: 'History', deliverables: [] },
          style: { width: 220, height: 'auto' }
        }
      ], 
      edges: [],
      metaConfig: EMPTY_META_CONFIG
    }
  ]);
  const [activeFlowId, setActiveFlowId] = useState<string>('1');

  const [nodes, setNodesState] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Persistence: Load on mount
  useEffect(() => {
    const saved = StorageManager.load();
    if (saved) {
        // Normalize flows to ensure deliverables is always an array
        const normalizedFlows = saved.flows.map(flow => ({
          ...flow,
          nodes: flow.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              deliverables: Array.isArray(node.data.deliverables) ? node.data.deliverables : []
            }
          }))
        }));
        
        setFlows(normalizedFlows);
        setActiveFlowId(saved.activeFlowId);
        setHasLoadedFromStorage(true);
        
        const activeFlow = normalizedFlows.find(f => f.id === saved.activeFlowId);
        if (activeFlow) {
            setNodesState(activeFlow.nodes);
            setEdges(activeFlow.edges);
        }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save if we have finished checking the initial storage state
    if (isInitialized && flows.length > 0) {
      StorageManager.save(flows, activeFlowId);
    }
  }, [flows, activeFlowId, isInitialized]);

  // Persistence: Sync canvas changes back to the flows array
  useEffect(() => {
    if (!isInitialized) return;
    
    // We update the flows array so it contains the current nodes and edges
    // This way, the save effect (which watches 'flows') will persist the latest state.
    setFlows(prev => prev.map(f => 
      f.id === activeFlowId ? { ...f, nodes, edges } : f
    ));
  }, [nodes, edges, activeFlowId, isInitialized]);
  
  const { toast } = useToast();
  const { fitView, getNodes, getEdges, project } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  // Wrapper to inject handlers into node data
  const setNodes = useCallback((value: Node[] | ((prev: Node[]) => Node[])) => {
    setNodesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      // We need these handlers to be stable or the nodes will re-render constantly?
      // Actually, passing functions in data is okay if they are memoized or if we accept re-renders.
      // But we can't memoize them inside this callback easily without recursion issues.
      // Better: Define handlers outside and expect them to be attached.
      // For now, we just map basic data. The handlers are attached in the RETURN object or contexts?
      // React Flow doesn't automatically pass hook functions to Node components.
      // We MUST inject them into `data`.
      return next.map(n => ({
        ...n,
        data: {
          ...n.data,
          onAddDeliverable: handleAddDeliverable,
          onSelectDeliverable: handleSelectDeliverable,
          onReorderDeliverables: handleReorderDeliverables,
          selectedDeliverableId: selectedDeliverableId // Inject current selection
        }
      }));
    });
  }, [selectedDeliverableId]); // Dependencies here allow data injection to update

  // We need to re-inject data when selectedDeliverableId changes
  // This effect ensures nodes are up-to-date with selection state
  // But wait, setNodes wraps setNodesState. If we just call setNodesState in an effect, it might loop?
  // Let's separate the "raw" nodes from "rendered" nodes? No, simpler.
  // Just update the nodes when selection changes using setNodesState directly.
  
  // Actually, separating logic is cleaner:
  // 1. Handlers defined (stable).
  // 2. Nodes state holds the data + handlers.

  // Let's define handlers first.
  
  const getNodeSize = useCallback((node: Node) => {
    const width = node.width || (node.style?.width as number) || STEP_WIDTH;
    let height = node.height || (node.style?.height as number);
    
    if (!height || typeof height === 'string') {
        const deliverablesCount = node.data?.deliverables?.length || 0;
        if (deliverablesCount === 0) {
            height = STEP_INITIAL_HEIGHT;
        } else {
            // Header (48) + padding (16) + deliverables (N * 40) + gaps ((N-1) * 8)
            height = 48 + 16 + (deliverablesCount * 40) + (Math.max(0, deliverablesCount - 1) * 8);
        }
    }
    return { width, height: height as number };
  }, []);

  const autoResizeGroups = useCallback((currentNodes: Node[]): Node[] => {
    const groups = currentNodes.filter(n => n.type === 'group');
    if (groups.length === 0) return currentNodes;

    const nextNodes = [...currentNodes];
    let iterations = 0;
    let hasChangedPass = true;
    
    while (hasChangedPass && iterations < 2) {
      hasChangedPass = false;
      
      groups.forEach(group => {
        const children = nextNodes.filter(c => c.parentNode === group.id);
        if (children.length === 0) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        children.forEach(child => {
          const { width: w, height: h } = getNodeSize(child);
          minX = Math.min(minX, child.position.x);
          minY = Math.min(minY, child.position.y);
          maxX = Math.max(maxX, child.position.x + w);
          maxY = Math.max(maxY, child.position.y + h);
        });

        const padding = 60;
        const dx = minX - padding;
        const dy = minY - padding;
        const nextWidth = maxX - minX + padding * 2;
        const nextHeight = maxY - minY + padding * 2;

        const gIdx = nextNodes.findIndex(n => n.id === group.id);
        const currentGroup = nextNodes[gIdx];
        const currentWidth = (currentGroup.style?.width as number) || 0;
        const currentHeight = (currentGroup.style?.height as number) || 0;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || 
            Math.abs(nextWidth - currentWidth) > 1 || 
            Math.abs(nextHeight - currentHeight) > 1) {
          
          hasChangedPass = true;
          
          nextNodes[gIdx] = {
            ...currentGroup,
            position: {
              x: currentGroup.position.x + dx,
              y: currentGroup.position.y + dy
            },
            style: {
              ...currentGroup.style,
              width: nextWidth,
              height: nextHeight
            }
          };

          // Compensate children
          nextNodes.forEach((node, idx) => {
            if (node.parentNode === group.id) {
              nextNodes[idx] = {
                ...node,
                position: {
                  x: node.position.x - dx,
                  y: node.position.y - dy
                }
              };
            }
          });
        }
      });
      iterations++;
    }

    return nextNodes;
  }, [getNodeSize]);

  const handleAddDeliverable = useCallback((stepId: string) => {
    setNodesState(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          const newDeliverable: Deliverable = {
            id: `del_${Date.now()}`,
            label: 'New Deliverable',
            color: '#edf2f7'
          };
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: [...(n.data.deliverables || []), newDeliverable]
            }
          };
        }
        return n;
      });
      return autoResizeGroups(next);
    });
  }, [autoResizeGroups]);

  const handleSelectDeliverable = useCallback((deliverableId: string | null) => {
    setSelectedDeliverableId(deliverableId);
  }, []);

  const handleReorderDeliverables = useCallback((stepId: string, newDeliverables: Deliverable[]) => {
    setNodesState(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          return { ...n, data: { ...n.data, deliverables: newDeliverables } };
        }
        return n;
      });
      return autoResizeGroups(next);
    });
  }, [autoResizeGroups]);

  const handleDeleteDeliverable = useCallback((stepId: string, deliverableId: string) => {
    setNodesState(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: (n.data.deliverables || []).filter((d: Deliverable) => d.id !== deliverableId)
            }
          };
        }
        return n;
      });
      return autoResizeGroups(next);
    });
    if (selectedDeliverableId === deliverableId) {
      setSelectedDeliverableId(null);
    }
  }, [selectedDeliverableId, autoResizeGroups]);

  const handleUpdateDeliverable = useCallback((stepId: string, deliverableId: string, updates: Partial<Deliverable>) => {
    setNodesState(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: (n.data.deliverables || []).map((d: Deliverable) => 
                d.id === deliverableId ? { ...d, ...updates } : d
              )
            }
          };
        }
        return n;
      });
      return autoResizeGroups(next);
    });
  }, [autoResizeGroups]);

  // Combined select handler
  const handleSelectDeliverableMain = useCallback((nodeId: string, deliverableId: string | null) => {
    if (deliverableId) {
        setNodesState(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
    }
    setSelectedDeliverableId(deliverableId);
  }, []);


  // Now the main setNodes wrapper that injects these handlers
  // We use a useEffect to keep data sync'd with current handlers?
  // Or just inject deeply every time we modify nodes?
  // The 'setNodes' exported is the one RF uses.
  
  // Ideally, we move `data` updates to a `useEffect` that watches `nodes` state?
  // No, that causes double renders.
  // Best way: Map on the fly during render? No, `nodes` is passed to RF.
  
  // Let's just modify the `nodes` state directly to include functions.
  // It's not serializable but RF handles it in memory.
  
  // IMPORTANT: We need `nodes` to be up to date with `selectedDeliverableId` for highlighting.
  // So we really need to update nodes when `selectedDeliverableId` changes.
  
  useEffect(() => {
    setNodesState(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        onAddDeliverable: handleAddDeliverable,
        onSelectDeliverable: handleSelectDeliverableMain,
        onReorderDeliverables: (items: Deliverable[]) => handleReorderDeliverables(n.id, items),
        selectedDeliverableId // Dynamic prop
      }
    })));
  }, [selectedDeliverableId, handleAddDeliverable, handleSelectDeliverableMain, handleReorderDeliverables]);

  // Auto-resize groups on mount to handle initialNodes
  useEffect(() => {
    setNodesState(nds => autoResizeGroups(nds));
  }, [autoResizeGroups]);


  const saveCurrentFlow = useCallback(() => {
    setFlows(prevFlows => prevFlows.map(f => 
      f.id === activeFlowId ? { ...f, nodes: getNodes(), edges: getEdges() } : f
    ));
  }, [activeFlowId, getNodes, getEdges]);

  const switchFlow = useCallback((flowId: string) => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    setFlows(prev => {
        // Save current
        const saved = prev.map(f => 
            f.id === activeFlowId ? { ...f, nodes: currentNodes, edges: currentEdges } : f
        );
        
        // Find next
        const nextFlow = saved.find(f => f.id === flowId);
        if (nextFlow) {
            setNodesState(nextFlow.nodes); // Raw state update
            setEdges(nextFlow.edges);
            setActiveFlowId(flowId);
            setSelectedDeliverableId(null); // Reset selection
            setTimeout(() => fitView({ duration: 300 }), 50);
        }
        return saved;
    });

  }, [activeFlowId, getNodes, getEdges, fitView]);

  const addFlow = useCallback(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const newId = `flow_${Date.now()}`;
    const newFlow: Flow = {
        id: newId,
        title: `Flow ${flows.length + 1}`,
        nodes: [],
        edges: [],
        metaConfig: EMPTY_META_CONFIG
    };

    setFlows(prev => {
         const saved = prev.map(f => 
            f.id === activeFlowId ? { ...f, nodes: currentNodes, edges: currentEdges } : f
        );
        return [...saved, newFlow];
    });

    setNodesState([]);
    setEdges([]);
    setActiveFlowId(newId);
    setSelectedDeliverableId(null);
    
  }, [activeFlowId, flows.length, getNodes, getEdges]);

  const updateFlowTitle = useCallback((flowId: string, newTitle: string) => {
    setFlows(prev => prev.map(f => f.id === flowId ? { ...f, title: newTitle } : f));
  }, []);

  const deleteFlow = useCallback((flowId: string) => {
    setFlows(prev => {
        if (prev.length <= 1) return prev; // Don't delete last flow
        
        const next = prev.filter(f => f.id !== flowId);
        if (activeFlowId === flowId) {
            // Find another flow to switch to
            const deletedIndex = prev.findIndex(f => f.id === flowId);
            const targetFlow = next[deletedIndex] || next[deletedIndex - 1] || next[0];
            
            if (targetFlow) {
                setActiveFlowId(targetFlow.id);
                // We MUST update the current nodes/edges state with the target flow's data
                setNodesState(targetFlow.nodes);
                setEdges(targetFlow.edges);
            }
        }
        return next;
    });
  }, [activeFlowId, setNodesState, setEdges]);

  const duplicateFlow = useCallback((flowId: string) => {
    const flowToDuplicate = flows.find(f => f.id === flowId);
    if (!flowToDuplicate) return;

    const newId = `flow_${Date.now()}`;
    const newFlow: Flow = {
        ...flowToDuplicate,
        id: newId,
        title: `${flowToDuplicate.title} (Copy)`,
        // We reuse nodes and edges. Since IDs are string, they are stable in the flow.
        // However, if we want them to be TRULY independent across flows (e.g. if we had global node registry),
        // we might need to deep clone. But here Flow.nodes is just a state snapshot.
        nodes: [...flowToDuplicate.nodes],
        edges: [...flowToDuplicate.edges],
    };

    setFlows(prev => [...prev, newFlow]);
    setActiveFlowId(newId);
  }, [flows]);

  const reorderFlow = useCallback((flowId: string, direction: 'left' | 'right') => {
    setFlows(prev => {
        const index = prev.findIndex(f => f.id === flowId);
        if (index === -1) return prev;
        
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;

        const next = [...prev];
        const [removed] = next.splice(index, 1);
        next.splice(newIndex, 0, removed);
        return next;
    });
  }, []);

  const updateMetaConfig = useCallback((type: keyof MetaConfig, config: FieldDefinition[]) => {
    setFlows(prev => prev.map(f => 
        f.id === activeFlowId ? { ...f, metaConfig: { ...f.metaConfig, [type]: config } } : f
    ));
  }, [activeFlowId]);

  const updateMetaData = useCallback((itemId: string, fieldId: string, value: any) => {
    setNodesState(nds => nds.map(n => {
        if (n.id === itemId) {
            return {
                ...n,
                data: {
                    ...n.data,
                    meta: { ...(n.data.meta || {}), [fieldId]: value }
                }
            };
        }
        return n;
    }));
  }, []);

  const updateDeliverableMetaData = useCallback((stepId: string, deliverableId: string, fieldId: string, value: any) => {
    setNodesState(nds => nds.map(n => {
        if (n.id === stepId) {
            return {
                ...n,
                data: {
                    ...n.data,
                    deliverables: (n.data.deliverables || []).map((d: Deliverable) => 
                        d.id === deliverableId ? { ...d, meta: { ...(d.meta || {}), [fieldId]: value } } : d
                    )
                }
            };
        }
        return n;
    }));
  }, []);


  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodesState((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      // Only auto-resize if there's a position change
      if (changes.some(c => c.type === 'position')) {
        return autoResizeGroups(nextNodes);
      }
      return nextNodes;
    });
  }, [autoResizeGroups]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true, label: '', style: { stroke: '#6B7280' } }, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
    // If we deselect everything, also deselect deliverable
    if (nodes.length === 0) {
        setSelectedDeliverableId(null);
    }
  }, []);

  const addStep = useCallback(() => {
    const { x, y } = project({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 });
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: { x, y },
      data: { label: 'New Step', color: '#E5E7EB', deliverables: [] }, // Init deliverables
      type: 'custom',
      style: { width: STEP_WIDTH, height: 'auto' }, // Use auto height
      zIndex: 30,
    };
    setNodesState((nds) => nds.concat(newNode));
  }, [nodes.length, project, setNodesState]);

  // Renamed to avoid Export confusion, but essentially this is the public addDeliverable
  const addDeliverablePublic = useCallback((parentId: string) => {
    handleAddDeliverable(parentId);
  }, [handleAddDeliverable]);

  const updateStepLabel = useCallback((stepId: string, label: string) => {
    setNodesState((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, label } } : node
      )
    );
  }, [setNodesState]);
  
  const updateStepColor = useCallback((stepId: string, color: string) => {
    setNodesState((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, color } } : node
      )
    );
  }, [setNodesState]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge))
    );
  }, [setEdges]);

  const updateEdgeColor = useCallback((edgeId: string, color: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, style: { ...edge.style, stroke: color } } : edge
      )
    );
  }, [setEdges]);

  const updateStepIcon = useCallback((stepId: string, icon: string) => {
    setNodesState((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, icon } } : node
      )
    );
  }, [setNodesState]);

  const updateEdgeIcon = useCallback((edgeId: string, icon: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, icon } } : edge
      )
    );
  }, [setEdges]);

  const deleteSelection = useCallback(() => {
    if (selectedDeliverableId && selectedNodes.length === 1) {
        // Delete deliverable mode
        handleDeleteDeliverable(selectedNodes[0].id, selectedDeliverableId);
        return;
    }

    const allNodes = getNodes();
    const currentSelectedNodes = allNodes.filter(n => n.selected);
    const currentSelectedEdges = getEdges().filter(e => e.selected);

    if (currentSelectedNodes.length === 0 && currentSelectedEdges.length === 0) return;

    let nodeIdsToDelete = new Set(currentSelectedNodes.map(n => n.id));
    
    currentSelectedNodes.forEach(node => {
      if(node.type === 'group' || allNodes.some(n => n.parentNode === node.id)) {
        allNodes.forEach(child => {
          if (child.parentNode === node.id) {
            nodeIdsToDelete.add(child.id);
          }
        });
      }
    });

    const edgeIdsToDelete = new Set(currentSelectedEdges.map(e => e.id));

    setNodesState(nds => {
      const next = nds.filter(n => !nodeIdsToDelete.has(n.id));
      return autoResizeGroups(next);
    });
    setEdges(eds => eds.filter(e => !edgeIdsToDelete.has(e.id) && !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)));

    setSelectedNodes([]);
    setSelectedEdges([]);
    setSelectedDeliverableId(null);

  }, [getNodes, getEdges, setNodesState, setEdges, selectedDeliverableId, selectedNodes, handleDeleteDeliverable]);
  
  const groupSelection = useCallback(() => {
    const currentSelectedNodes = getNodes().filter(n => n.selected && !n.parentNode);
    if (currentSelectedNodes.length < 2) {
      toast({ variant: 'destructive', title: 'Cannot Group', description: 'Select at least two top-level steps to group them.'});
      return;
    }

    const nodesHaveDimensions = currentSelectedNodes.every(n => n.width && n.height);
    if (!nodesHaveDimensions) {
        toast({
            variant: 'destructive',
            title: 'Cannot Group Yet',
            description: 'Still calculating step sizes. Please try again in a moment.'
        });
        return;
    }

    const padding = 60; // Increased padding for better encapsulation
    const { minX, maxX, minY, maxY } = currentSelectedNodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x + node.width!),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y + node.height!),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    
    const parentId = `group_${Date.now()}`;
    const parentNode: Node = {
      id: parentId,
      type: 'group', // Use dedicated group type
      data: { label: 'New Group', color: '#E5E7EB' },
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '12px',
        padding: 0,
      },
      className: '!border-0 !bg-transparent !p-0 !shadow-none !outline-none !ring-0',
      zIndex: 0,
    };

    setNodesState(nds => {
      const newNodes = nds.map(n => {
        if (currentSelectedNodes.some(sn => sn.id === n.id)) {
          return {
            ...n,
            parentNode: parentId,
            // extent: 'parent' removed to allow dynamic resizing
            position: {
              x: n.position.x - parentNode.position.x,
              y: n.position.y - parentNode.position.y,
            },
            selected: false,
          };
        }
        return n;
      });
      return autoResizeGroups([parentNode, ...newNodes]);
    });

  }, [getNodes, setNodesState, toast]);

  const ungroupSelection = useCallback(() => {
    const selectedGroup = getNodes().find(n => n.selected && n.type === 'group');
    if (!selectedGroup) return;

    setNodesState(nds => {
      const children = nds.filter(n => n.parentNode === selectedGroup.id);
      
      const updatedChildren = children.map(child => ({
        ...child,
        parentNode: undefined,
        extent: undefined,
        position: {
          x: selectedGroup.position.x + child.position.x,
          y: selectedGroup.position.y + child.position.y,
        }
      }));

      const childrenIds = new Set(children.map(c => c.id));
      const remainingNodes = nds.filter(n => n.id !== selectedGroup.id && !childrenIds.has(n.id));

      return [...updatedChildren, ...remainingNodes];
    });
  }, [getNodes, setNodesState]);

  const handleAutoLayout = useCallback((options?: { silent: boolean }) => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    if (allNodes.length === 0) {
      if (!options?.silent) {
        toast({
          title: "No steps to arrange",
          description: "Add some steps to the canvas first.",
        });
      }
      return;
    }

    const topLevelNodes = allNodes.filter(node => !node.parentNode);
    
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const getLayoutNodeId = (nodeId: string): string => {
        let current = nodeMap.get(nodeId);
        while (current?.parentNode) {
            current = nodeMap.get(current.parentNode);
        }
        return current?.id || nodeId;
    };


    const adj = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    topLevelNodes.forEach(node => {
        adj.set(node.id, new Set());
        inDegree.set(node.id, 0);
    });

    allEdges.forEach(edge => {
        const sourceLayoutId = getLayoutNodeId(edge.source);
        const targetLayoutId = getLayoutNodeId(edge.target);

        if (sourceLayoutId !== targetLayoutId && adj.has(sourceLayoutId) && adj.has(targetLayoutId)) {
             if (!adj.get(sourceLayoutId)!.has(targetLayoutId)) {
                adj.get(sourceLayoutId)!.add(targetLayoutId);
                inDegree.set(targetLayoutId, (inDegree.get(targetLayoutId) || 0) + 1);
            }
        }
    });
    
    const queue: string[] = [];
    topLevelNodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
            queue.push(node.id);
        }
    });

    const columns: string[][] = [];
    
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentColumn: string[] = [];
        for (let i = 0; i < levelSize; i++) {
            const u = queue.shift()!;
            currentColumn.push(u);

            (Array.from(adj.get(u) || [])).forEach(v => {
                const newDegree = (inDegree.get(v) || 1) - 1;
                inDegree.set(v, newDegree);
                if (newDegree === 0) {
                    queue.push(v);
                }
            });
        }
        columns.push(currentColumn);
    }
    
    const visitedNodes = new Set(columns.flat());
    const remainingNodes = topLevelNodes.filter(node => !visitedNodes.has(node.id));
    if (remainingNodes.length > 0) {
        columns.push(remainingNodes.map(node => node.id));
        if (!options?.silent) {
          toast({
              variant: "destructive",
              title: "Cyclic Dependency Detected",
              description: "Some steps form a loop and have been placed in the last column.",
          });
        }
    }

    const vSpacing = 50;
    const newNodes = getNodes().map(n => ({ ...n }));

    let currentX = 0;
    columns.forEach((column, index) => {
        const columnWidth = Math.max(...column.map(nodeId => {
            const node = allNodes.find(n => n.id === nodeId);
            return node ? getNodeSize(node).width : STEP_WIDTH;
        }));

        const columnHeight = column.reduce((sum, nodeId) => {
            const node = allNodes.find(n => n.id === nodeId);
            return sum + (node ? getNodeSize(node).height : STEP_INITIAL_HEIGHT) + vSpacing;
        }, -vSpacing);

        let currentY = -columnHeight / 2;

        column.forEach((nodeId) => {
            const node = newNodes.find(n => n.id === nodeId);
            if (node) {
                const { width: nodeWidth, height: nodeHeight } = getNodeSize(node);
                
                node.position = { x: currentX + (columnWidth - nodeWidth) / 2, y: currentY };
                currentY += nodeHeight + vSpacing;
            }
        });

        // Calculate spacing for the next column
        let nextHSpacing = 100; // Default
        if (index < columns.length - 1) {
            const currentColumnNodes = new Set(column);
            const nextColumnNodes = new Set(columns[index + 1]);
            
            // Check if any edge between these two columns has a label or icon
            const hasEdgeContent = allEdges.some(edge => {
                const sourceLayoutId = getLayoutNodeId(edge.source);
                const targetLayoutId = getLayoutNodeId(edge.target);
                return currentColumnNodes.has(sourceLayoutId) && 
                       nextColumnNodes.has(targetLayoutId) && 
                       (edge.label || edge.data?.icon);
            });

            if (hasEdgeContent) {
                nextHSpacing = 200; // Double the spacing if content is present
            }
        }

        currentX += columnWidth + nextHSpacing;
    });

    setNodesState(newNodes);
    if (!options?.silent) {
      toast({
        title: "Layout Arranged",
        description: "Steps have been arranged from left to right.",
      });
      setTimeout(() => fitView({ duration: 500 }), 100);
    }
    // Initial silent layout doesn't trigger fitView here; 
    // VectorFlow handles initial fit after nodes are measured.

  }, [getNodes, getEdges, setNodesState, fitView, toast]);

  return {
    flows,
    activeFlowId,
    switchFlow,
    addFlow,
    updateFlowTitle,
    deleteFlow,
    duplicateFlow,
    reorderFlow,
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    selectedDeliverableId,
    setNodes: setNodesState, // Export generic setter
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    addStep,
    addDeliverable: addDeliverablePublic,
    updateStepLabel,
    updateStepColor,
    updateStepIcon,
    updateEdgeLabel,
    updateEdgeColor,
    updateEdgeIcon,
    updateDeliverable: handleUpdateDeliverable,
    deleteSelection,
    groupSelection,
    ungroupSelection,
    handleAutoLayout,
    selectDeliverable: (nodeId: string, deliverableId: string | null) => handleSelectDeliverableMain(nodeId, deliverableId),
    metaConfig: flows.find(f => f.id === activeFlowId)?.metaConfig || EMPTY_META_CONFIG,
    updateMetaConfig,
    updateMetaData,
    updateDeliverableMetaData,
    hasLoadedFromStorage,
  };
};
