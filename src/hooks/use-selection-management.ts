import { useCallback } from 'react';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from 'reactflow';

/**
 * Hook for managing node and edge selections and deletions.
 */
export function useSelectionManagement(
  setSelectedNodes: (nodes: Node[]) => void,
  setSelectedEdges: (edges: Edge[]) => void,
  setSelectedDeliverableId: (id: string | null) => void,
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void,
  setEdges: (value: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  getNodes: () => Node[],
  getEdges: () => Edge[],
  autoResizeGroups: (nodes: Node[]) => Node[],
  deleteDeliverable: (stepId: string, deliverableId: string) => void,
  selectedNodes: Node[],
  selectedDeliverableId: string | null
) {
  // Helper to determine node type
  const getNodeType = useCallback((nodeId: string) => {
    const node = getNodes().find(n => n.id === nodeId);
    return node?.type;
  }, [getNodes]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
    if (nodes.length === 0) {
        setSelectedDeliverableId(null);
    }
  }, [setSelectedNodes, setSelectedEdges, setSelectedDeliverableId]);

  const deleteSelection = useCallback(() => {
    if (selectedDeliverableId && selectedNodes.length === 1) {
        deleteDeliverable(selectedNodes[0].id, selectedDeliverableId);
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
          if (child.parentNode === node.id) nodeIdsToDelete.add(child.id);
        });
      }
    });

    const edgeIdsToDelete = new Set(currentSelectedEdges.map(e => e.id));

    setNodes(nds => {
      const next = nds.filter(n => !nodeIdsToDelete.has(n.id));
      return autoResizeGroups(next);
    });
    
    setEdges(eds => eds.filter(e => 
      !edgeIdsToDelete.has(e.id) && 
      !nodeIdsToDelete.has(e.source) && 
      !nodeIdsToDelete.has(e.target)
    ));

    setSelectedNodes([]);
    setSelectedEdges([]);
    setSelectedDeliverableId(null);
  }, [selectedDeliverableId, selectedNodes, deleteDeliverable, getNodes, getEdges, setNodes, setEdges, autoResizeGroups, setSelectedNodes, setSelectedEdges, setSelectedDeliverableId]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter selection changes for groups during multi-select
    // Heuristic: If we have multiple 'select: true' changes, it's likely a box selection.
    // In that case, we want to exclude groups.
    const selectChanges = changes.filter(c => c.type === 'select' && c.selected) as any[];
    
    let filteredChanges = changes;
    
    // If selecting multiple items (box select), prevent group selection
    if (selectChanges.length > 1) {
       const groupIds = new Set();
       selectChanges.forEach(change => {
           if (getNodeType(change.id) === 'group') {
               groupIds.add(change.id);
           }
       });

       if (groupIds.size > 0) {
           // Remove select changes for groups
           filteredChanges = changes.filter(c => 
               !(c.type === 'select' && groupIds.has(c.id))
           );
       }
    }

    setNodes((nds) => {
      const nextNodes = applyNodeChanges(filteredChanges, nds);
      if (filteredChanges.some(c => c.type === 'position' || c.type === 'dimensions')) {
        return autoResizeGroups(nextNodes);
      }
      return nextNodes;
    });
  }, [setNodes, autoResizeGroups, getNodeType]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  return {
    onSelectionChange,
    deleteSelection,
    onNodesChange,
    onEdgesChange,
  };
}
