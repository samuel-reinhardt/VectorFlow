import { useCallback } from 'react';
import { Edge, OnConnect, addEdge } from 'reactflow';
import { DEFAULT_COLORS } from '@/lib/constants';

/**
 * Hook for managing edge (Connection) operations.
 * Handles adding connections and updating their properties.
 */
export function useEdgeOperations(
  setEdges: (value: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  isReadOnly: boolean = false
) {
  const onConnect: OnConnect = useCallback((connection) => {
    // Prevent creating new connections in read-only mode
    if (isReadOnly) return;
    
    setEdges((eds) => addEdge({ 
      ...connection, 
      animated: true, 
      label: '', 
      style: { stroke: DEFAULT_COLORS.CONNECTION } 
    }, eds));
  }, [setEdges, isReadOnly]);

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

  const updateEdgeIcon = useCallback((edgeId: string, icon: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, icon } } : edge
      )
    );
  }, [setEdges]);

  return {
    onConnect,
    updateEdgeLabel,
    updateEdgeColor,
    updateEdgeIcon,
  };
}
