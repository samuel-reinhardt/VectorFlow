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
  const { project } = useReactFlow();

  const addStep = useCallback(() => {
    // Project screen center to flow coordinates
    const { x, y } = project({ 
      x: window.innerWidth / 2 - 300, 
      y: window.innerHeight / 2 
    });
    
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: { x, y },
      data: { label: 'New Step', color: '#E5E7EB', deliverables: [] },
      type: 'custom',
      style: { width: DIMENSIONS.STEP_WIDTH, height: 'auto' },
      zIndex: 30,
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, project, setNodes]);

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
