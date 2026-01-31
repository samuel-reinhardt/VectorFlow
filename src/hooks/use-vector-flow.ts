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

const STEP_WIDTH = 220;
const STEP_INITIAL_HEIGHT = 60;
const STEP_HEADER_HEIGHT = 48;
const DELIVERABLE_HEIGHT = 40;
const DELIVERABLE_Y_PADDING = 8;
const DELIVERABLE_X_PADDING = 12;
const DELIVERABLE_WIDTH = STEP_WIDTH - (DELIVERABLE_X_PADDING * 2);

export type Deliverable = {
  id: string;
  label: string;
  color: string;
};

export type Flow = {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
};

export const useVectorFlow = (initialNodes: Node[], initialEdges: Edge[]) => {
  const [flows, setFlows] = useState<Flow[]>([
    { id: '1', title: 'Flow 1', nodes: initialNodes, edges: initialEdges }
  ]);
  const [activeFlowId, setActiveFlowId] = useState<string>('1');

  const [nodes, setNodesState] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  
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
  
  const handleAddDeliverable = useCallback((stepId: string) => {
    setNodesState(nds => nds.map(n => {
      if (n.id === stepId) {
        const newDeliverable: Deliverable = {
          id: `del_${Date.now()}`,
          label: 'New Deliverable',
          color: '#E0E7FF'
        };
        const currentDeliverables = n.data.deliverables || [];
        return {
          ...n,
          data: {
            ...n.data,
            deliverables: [...currentDeliverables, newDeliverable]
          }
        };
      }
      return n;
    }));
  }, []);

  const handleSelectDeliverable = useCallback((deliverableId: string | null) => {
    setSelectedDeliverableId(deliverableId);
  }, []);

  const handleReorderDeliverables = useCallback((stepId: string, newDeliverables: Deliverable[]) => {
    setNodesState(nds => nds.map(n => {
      if (n.id === stepId) {
        return { ...n, data: { ...n.data, deliverables: newDeliverables } };
      }
      return n;
    }));
  }, []);

  const handleDeleteDeliverable = useCallback((stepId: string, deliverableId: string) => {
    setNodesState(nds => nds.map(n => {
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
    }));
    if (selectedDeliverableId === deliverableId) {
      setSelectedDeliverableId(null);
    }
  }, [selectedDeliverableId]);

  const handleUpdateDeliverable = useCallback((stepId: string, deliverableId: string, updates: Partial<Deliverable>) => {
    setNodesState(nds => nds.map(n => {
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
    }));
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
        onSelectDeliverable: handleSelectDeliverable,
        onReorderDeliverables: handleReorderDeliverables,
        selectedDeliverableId // Dynamic prop
      }
    })));
  }, [selectedDeliverableId, handleAddDeliverable, handleSelectDeliverable, handleReorderDeliverables]);


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
        edges: []
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

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodesState((nds) => applyNodeChanges(changes, nds)), [setNodesState]);
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
      if(node.data.isGroup || allNodes.some(n => n.parentNode === node.id)) {
        allNodes.forEach(child => {
          if (child.parentNode === node.id) {
            nodeIdsToDelete.add(child.id);
          }
        });
      }
    });

    const edgeIdsToDelete = new Set(currentSelectedEdges.map(e => e.id));

    setNodesState(nds => nds.filter(n => !nodeIdsToDelete.has(n.id)));
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

    const padding = 50;
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
      type: 'custom',
      data: { label: 'New Group', color: '#E5E7EB', isGroup: true },
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      },
      zIndex: -1,
    };

    setNodesState(nds => {
      const newNodes = nds.map(n => {
        if (currentSelectedNodes.some(sn => sn.id === n.id)) {
          return {
            ...n,
            parentNode: parentId,
            extent: 'parent' as const,
            position: {
              x: n.position.x - parentNode.position.x,
              y: n.position.y - parentNode.position.y,
            },
            selected: false,
          };
        }
        return n;
      });
      return [parentNode, ...newNodes];
    });

  }, [getNodes, setNodesState, toast]);

  const ungroupSelection = useCallback(() => {
    const selectedGroup = getNodes().find(n => n.selected && n.data.isGroup);
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

    const hSpacing = 100;
    const vSpacing = 50;
    const newNodes = getNodes().map(n => ({ ...n }));

    let currentX = 0;
    columns.forEach((column) => {
        const columnWidth = Math.max(...column.map(nodeId => {
            const node = allNodes.find(n => n.id === nodeId);
            return node?.width || STEP_WIDTH;
        }));

        const columnHeight = column.reduce((sum, nodeId) => {
            const node = allNodes.find(n => n.id === nodeId);
            const height = node?.height || STEP_INITIAL_HEIGHT;
            return sum + height + vSpacing;
        }, -vSpacing);

        let currentY = -columnHeight / 2;

        column.forEach((nodeId) => {
            const node = newNodes.find(n => n.id === nodeId);
            if (node) {
                const nodeWidth = node.width || STEP_WIDTH;
                const height = node.height || STEP_INITIAL_HEIGHT;
                
                node.position = { x: currentX + (columnWidth - nodeWidth) / 2, y: currentY };
                currentY += height + vSpacing;
            }
        });

        currentX += columnWidth + hSpacing;
    });

    setNodesState(newNodes);
    if (!options?.silent) {
      toast({
        title: "Layout Arranged",
        description: "Steps have been arranged from left to right.",
      });
    }
    setTimeout(() => fitView({ duration: 500 }), 100);

  }, [getNodes, getEdges, setNodesState, fitView, toast]);

  return {
    flows,
    activeFlowId,
    switchFlow,
    addFlow,
    updateFlowTitle,
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
    updateEdgeLabel,
    updateEdgeColor,
    deleteSelection,
    groupSelection,
    ungroupSelection,
    handleAutoLayout,
    handleUpdateDeliverable, // New export
    selectDeliverable: handleSelectDeliverable, // New export
  };
};
