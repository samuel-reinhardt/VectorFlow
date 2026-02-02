import { useCallback } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { DIMENSIONS } from '@/lib/constants';

/**
 * Hook for managing node (Step) operations.
 * Handles adding steps and updating their basic properties.
 */
export function useNodeOperations(
  nodes: Node[],
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void
) {
  const { project, screenToFlowPosition } = useReactFlow();

  const addStep = useCallback((position?: { x: number; y: number }) => {
    let pos = position;

    // smart placement logic
    if (!pos) {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
            // Place to the right of the right-most selected node
            const rightMost = selectedNodes.reduce((prev, curr) => 
                (curr.position.x > prev.position.x) ? curr : prev
            );
            
            pos = {
                x: rightMost.position.x + DIMENSIONS.STEP_WIDTH + 100, // 100px gap
                y: rightMost.position.y
            };
        } else {
            // Default center placement with jitter using screenToFlowPosition
            // Use window center converted to flow coords
            const center = screenToFlowPosition({ 
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2 
            });
            
            // Add slight jitter to prevent exact stacking
            pos = {
                x: center.x + (Math.random() * 40 - 20),
                y: center.y + (Math.random() * 40 - 20)
            };
        }
    }
    
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: pos,
      data: { label: 'New Step', color: '#E5E7EB', deliverables: [] },
      type: 'custom',
      style: { width: DIMENSIONS.STEP_WIDTH, height: 'auto' },
      zIndex: 30,
      selected: true, // Auto-select
    };
    
    setNodes((nds) => (nds.map(n => ({ ...n, selected: false })) as Node[]).concat(newNode));
    
    return newNodeId;
  }, [nodes, project, setNodes]);

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

  const updateStepIcon = useCallback((stepId: string, icon: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, icon } } : node
      )
    );
  }, [setNodes]);

  return {
    addStep,
    updateStepLabel,
    updateStepColor,
    updateStepIcon,
  };
}
