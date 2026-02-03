import { useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import type { Deliverable } from '@/types';

/**
 * Hook for managing entity metadata updates.
 * Handles both top-level metadata and nested deliverable metadata.
 */
export function useMetadataOperations(
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void,
  setEdges?: (value: Edge[] | ((prev: Edge[]) => Edge[])) => void
) {
  const updateMetaData = useCallback((itemId: string, fieldId: string, value: any) => {
    setNodes(nds => nds.map(n => {
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
  }, [setNodes]);

  const updateDeliverableMetaData = useCallback((stepId: string, deliverableId: string, fieldId: string, value: any) => {
    setNodes(nds => nds.map(n => {
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
  }, [setNodes]);

  const updateEdgeMetaData = useCallback((edgeId: string, fieldId: string, value: any) => {
    if (!setEdges) return;
    setEdges(eds => eds.map(e => {
        if (e.id === edgeId) {
            return {
                ...e,
                data: {
                    ...e.data,
                    meta: { ...(e.data?.meta || {}), [fieldId]: value }
                }
            };
        }
        return e;
    }));
  }, [setEdges]);

  return {
    updateMetaData,
    updateDeliverableMetaData,
    updateEdgeMetaData
  };
}
