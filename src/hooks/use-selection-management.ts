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
    setNodes((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      if (changes.some(c => c.type === 'position' || c.type === 'dimensions')) {
        return autoResizeGroups(nextNodes);
      }
      return nextNodes;
    });
  }, [setNodes, autoResizeGroups]);

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
