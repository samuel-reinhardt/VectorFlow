'use client';

import { useState, useCallback } from 'react';
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

export const useVectorFlow = (initialNodes: Node[], initialEdges: Edge[]) => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  
  const { toast } = useToast();
  const { fitView, getNode, getNodes, getEdges, project } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true, label: '', style: { stroke: '#6B7280' } }, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);

  const addStep = useCallback(() => {
    const { x, y } = project({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 });
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: { x, y },
      data: { label: 'New Step', color: '#E5E7EB' },
      type: 'custom',
      style: { width: STEP_WIDTH, height: STEP_INITIAL_HEIGHT },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, project, setNodes]);

  const addDeliverable = useCallback((parentId: string) => {
    const parentNode = getNode(parentId);
    if (!parentNode) {
        toast({
            variant: 'destructive',
            title: 'Cannot add deliverable',
            description: 'Parent step not found.'
        });
        return;
    }
    
    const childDeliverables = getNodes().filter(n => n.parentNode === parentId && n.data.isDeliverable);

    const newDeliverableY = STEP_HEADER_HEIGHT + DELIVERABLE_Y_PADDING + (childDeliverables.length * (DELIVERABLE_HEIGHT + DELIVERABLE_Y_PADDING));

    const newDeliverableId = `deliverable_${getNodes().length + 1}_${Date.now()}`;
    const newDeliverableNode: Node = {
        id: newDeliverableId,
        type: 'custom',
        data: { label: 'New Deliverable', color: '#E0E7FF', isDeliverable: true },
        position: { x: DELIVERABLE_X_PADDING, y: newDeliverableY },
        parentNode: parentId,
        extent: 'parent',
        style: {
            width: DELIVERABLE_WIDTH,
            height: DELIVERABLE_HEIGHT,
        }
    };

    setNodes(nds => {
        const newNodes = nds.map(n => {
            if (n.id === parentId) {
                const newHeight = STEP_HEADER_HEIGHT + DELIVERABLE_Y_PADDING + ((childDeliverables.length + 1) * (DELIVERABLE_HEIGHT + DELIVERABLE_Y_PADDING)) + DELIVERABLE_Y_PADDING;
                return {
                    ...n,
                    data: { ...n.data, hasDeliverables: true },
                    style: { ...n.style, height: newHeight, width: STEP_WIDTH },
                };
            }
            return n;
        });
        return [...newNodes, newDeliverableNode];
    });

    updateNodeInternals(parentId);
  }, [getNodes, getNode, setNodes, toast, updateNodeInternals]);

  const updateStepLabel = useCallback((stepId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, label } } : node
      )
    );
  }, [setNodes]);
  
  const updateStepColor = useCallback((stepId: string, color: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, color } } : node
      )
    );
  }, [setNodes]);

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

    const parentsOfDeletedDeliverables = new Set<string>();
    allNodes.forEach(node => {
      if (nodeIdsToDelete.has(node.id) && node.parentNode && node.data.isDeliverable) {
        parentsOfDeletedDeliverables.add(node.parentNode);
      }
    });

    const edgeIdsToDelete = new Set(currentSelectedEdges.map(e => e.id));

    setNodes(nds => {
      const remainingNodesUnmodified = nds.filter(n => !nodeIdsToDelete.has(n.id));
      const nodesToReturn = [...remainingNodesUnmodified];

      parentsOfDeletedDeliverables.forEach(parentId => {
        const parentIndex = nodesToReturn.findIndex(n => n.id === parentId);
        if (parentIndex === -1) return;

        const childDeliverables = nodesToReturn
          .filter(n => n.parentNode === parentId && n.data.isDeliverable)
          .sort((a,b) => a.position.y - b.position.y);
        
        const hasDeliverables = childDeliverables.length > 0;
        const newHeight = hasDeliverables
          ? STEP_HEADER_HEIGHT + DELIVERABLE_Y_PADDING + (childDeliverables.length * (DELIVERABLE_HEIGHT + DELIVERABLE_Y_PADDING)) + DELIVERABLE_Y_PADDING
          : STEP_INITIAL_HEIGHT;

        nodesToReturn[parentIndex] = {
          ...nodesToReturn[parentIndex],
          style: { ...nodesToReturn[parentIndex].style, height: newHeight },
          data: { ...nodesToReturn[parentIndex].data, hasDeliverables }
        };

        let currentY = STEP_HEADER_HEIGHT + DELIVERABLE_Y_PADDING;
        childDeliverables.forEach(deliverable => {
            const deliverableIndex = nodesToReturn.findIndex(n => n.id === deliverable.id);
            if (deliverableIndex !== -1) {
                nodesToReturn[deliverableIndex] = {
                    ...nodesToReturn[deliverableIndex],
                    position: { ...nodesToReturn[deliverableIndex].position, y: currentY }
                };
                currentY += DELIVERABLE_HEIGHT + DELIVERABLE_Y_PADDING;
            }
        });
      });
      return nodesToReturn;
    });

    setEdges(eds => eds.filter(e => !edgeIdsToDelete.has(e.id) && !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)));

    setSelectedNodes([]);
    setSelectedEdges([]);

    parentsOfDeletedDeliverables.forEach(parentId => {
      updateNodeInternals(parentId);
    });

  }, [getNodes, getEdges, setNodes, setEdges, updateNodeInternals]);
  
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

    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (currentSelectedNodes.some(sn => sn.id === n.id)) {
          return {
            ...n,
            parentNode: parentId,
            extent: 'parent',
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

  }, [getNodes, setNodes, toast]);

  const ungroupSelection = useCallback(() => {
    const selectedGroup = getNodes().find(n => n.selected && n.data.isGroup);
    if (!selectedGroup) return;

    setNodes(nds => {
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

      return [...remainingNodes, ...updatedChildren];
    });
  }, [getNodes, setNodes]);

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

    setNodes(newNodes);
    if (!options?.silent) {
      toast({
        title: "Layout Arranged",
        description: "Steps have been arranged from left to right.",
      });
    }
    setTimeout(() => fitView({ duration: 500 }), 100);

  }, [getNodes, getEdges, setNodes, fitView, toast]);

  return {
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    addStep,
    addDeliverable,
    updateStepLabel,
    updateStepColor,
    updateEdgeLabel,
    updateEdgeColor,
    deleteSelection,
    groupSelection,
    ungroupSelection,
    handleAutoLayout,
  };
};
