import { useCallback } from 'react';
import { Node } from 'reactflow';
import type { Deliverable } from '@/types';
import { DEFAULT_COLORS } from '@/lib/constants';

/**
 * Hook for managing deliverable operations within steps.
 * Handles adding, reordering, deleting, and updating deliverables.
 */
export function useDeliverableOperations(
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void,
  setSelectedDeliverableId: (id: string | null) => void
) {
  const handleAddDeliverable = useCallback((stepId: string) => {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          const deliverables = n.data.deliverables || [];
          const newDeliverable: Deliverable = {
            id: `del_${Date.now()}`,
            label: 'New Deliverable',
            color: DEFAULT_COLORS.DELIVERABLE,
          };
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: [...deliverables, newDeliverable]
            }
          };
        }
        return n;
      });
      return next;
    });
  }, [setNodes]);

  const handleReorderDeliverables = useCallback((stepId: string, newDeliverables: Deliverable[]) => {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          return {
            ...n,
            data: { ...n.data, deliverables: newDeliverables }
          };
        }
        return n;
      });
      return next;
    });
  }, [setNodes]);

  const handleDeleteDeliverable = useCallback((stepId: string, deliverableId: string) => {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          const deliverables = n.data.deliverables || [];
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: deliverables.filter((d: Deliverable) => d.id !== deliverableId)
            }
          };
        }
        return n;
      });
      return next;
    });
    setSelectedDeliverableId(null);
  }, [setNodes, setSelectedDeliverableId]);

  const handleUpdateDeliverable = useCallback((stepId: string, deliverableId: string, updates: Partial<Deliverable>) => {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id === stepId) {
          const deliverables = n.data.deliverables || [];
          return {
            ...n,
            data: {
              ...n.data,
              deliverables: deliverables.map((d: Deliverable) => 
                d.id === deliverableId ? { ...d, ...updates } : d
              )
            }
          };
        }
        return n;
      });
      return next;
    });
  }, [setNodes]);

  const handleSelectDeliverable = useCallback((nodeId: string, deliverableId: string | null) => {
    if (deliverableId === null) {
      setSelectedDeliverableId(null);
      return;
    }
    
    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
    setSelectedDeliverableId(deliverableId);
  }, [setNodes, setSelectedDeliverableId]);

  return {
    addDeliverable: handleAddDeliverable,
    reorderDeliverables: handleReorderDeliverables,
    deleteDeliverable: handleDeleteDeliverable,
    updateDeliverable: handleUpdateDeliverable,
    selectDeliverable: handleSelectDeliverable,
  };
}
