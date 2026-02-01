import { useEffect, useState } from 'react';
import { StorageManager } from '@/lib/storage';
import type { Flow } from '@/types';
import type { Node } from 'reactflow';

/**
 * Hook for managing flow persistence to/from localStorage.
 * Handles loading on mount and saving on changes with data normalization.
 */
export function useFlowPersistence(
  flows: Flow[],
  activeFlowId: string,
  onLoad: (flows: Flow[], activeFlowId: string) => void
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const saved = StorageManager.load();
    
    if (saved) {
      // Normalize flows to ensure deliverables is always an array
      const normalizedFlows = saved.flows.map(flow => ({
        ...flow,
        nodes: flow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            deliverables: Array.isArray(node.data.deliverables) 
              ? node.data.deliverables 
              : []
          }
        }))
      }));

      onLoad(normalizedFlows, saved.activeFlowId);
      setHasLoadedFromStorage(true);
    } else {
      // Nothing in storage, mark as loaded anyway to allow saves
      setHasLoadedFromStorage(true);
    }
    
    setIsInitialized(true);
  }, [onLoad]);

  // Save to storage whenever flows or activeFlowId changes
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage) {
      StorageManager.save(flows, activeFlowId);
    }
  }, [flows, activeFlowId, isInitialized, hasLoadedFromStorage]);

  return {
    isInitialized,
    hasLoadedFromStorage
  };
}
