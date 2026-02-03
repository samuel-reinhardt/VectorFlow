import { useState, useCallback } from 'react';
import type { Flow, MetaConfig } from '@/types';
import type { Node, Edge } from 'reactflow';
import { EMPTY_META_CONFIG } from '@/types';

/**
 * Hook for managing the collection of flows in a project.
 * Handles flow CRUD operations and switching between flows.
 */
export function useFlowState(
  initialFlows: Flow[],
  activeFlowId: string,
  initialGoogleDriveFileId: string | undefined, // Added
  setActiveFlowId: (id: string) => void,
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  setSelectedDeliverableId: (id: string | null) => void,
  getNodes: () => Node[],
  getEdges: () => Edge[]
) {
  const [flows, setFlows] = useState<Flow[]>(initialFlows);
  const [googleDriveFileId, setGoogleDriveFileId] = useState<string | undefined>(initialGoogleDriveFileId); // Added

  const saveCurrentFlowState = useCallback(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    setFlows(prev => prev.map(f => 
      f.id === activeFlowId ? { ...f, nodes: currentNodes, edges: currentEdges } : f
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
        setNodes(nextFlow.nodes);
        setEdges(nextFlow.edges);
        setActiveFlowId(flowId);
        setSelectedDeliverableId(null);
      }
      return saved;
    });
  }, [activeFlowId, getNodes, getEdges, setNodes, setEdges, setActiveFlowId, setSelectedDeliverableId]);

  const addFlow = useCallback(() => {
    saveCurrentFlowState();
    
    const currentConfig = flows[0]?.metaConfig || EMPTY_META_CONFIG;

    const newId = `flow_${Date.now()}`;
    const newFlow: Flow = {
      id: newId,
      title: `Flow ${flows.length + 1}`,
      nodes: [],
      edges: [],
      metaConfig: currentConfig
    };

    setFlows(prev => [...prev, newFlow]);
    setNodes([]);
    setEdges([]);
    setActiveFlowId(newId);
    setSelectedDeliverableId(null);
  }, [flows, saveCurrentFlowState, setNodes, setEdges, setActiveFlowId, setSelectedDeliverableId]);

  const updateFlowTitle = useCallback((flowId: string, newTitle: string) => {
    setFlows(prev => prev.map(f => f.id === flowId ? { ...f, title: newTitle } : f));
  }, []);

  const deleteFlow = useCallback((flowId: string) => {
    setFlows(prev => {
      if (prev.length <= 1) return prev;
      
      const next = prev.filter(f => f.id !== flowId);
      if (activeFlowId === flowId) {
        const deletedIndex = prev.findIndex(f => f.id === flowId);
        const targetFlow = next[deletedIndex] || next[deletedIndex - 1] || next[0];
        
        if (targetFlow) {
          setActiveFlowId(targetFlow.id);
          setNodes(targetFlow.nodes);
          setEdges(targetFlow.edges);
        }
      }
      return next;
    });
  }, [activeFlowId, setActiveFlowId, setNodes, setEdges]);

  const duplicateFlow = useCallback((flowId: string) => {
    const flowToDuplicate = flows.find(f => f.id === flowId);
    if (!flowToDuplicate) return;

    const newId = `flow_${Date.now()}`;
    const newFlow: Flow = {
      ...flowToDuplicate,
      id: newId,
      title: `${flowToDuplicate.title} (Copy)`,
      nodes: [...flowToDuplicate.nodes],
      edges: [...flowToDuplicate.edges],
    };

    setFlows(prev => [...prev, newFlow]);
    setActiveFlowId(newId);
  }, [flows, setActiveFlowId]);

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

  const updateMetaConfig = useCallback((type: keyof MetaConfig, config: any) => {
    setFlows(prev => prev.map(f => ({
      ...f,
      metaConfig: { ...f.metaConfig, [type]: config }
    })));
  }, []);

  return {
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
  };
}
