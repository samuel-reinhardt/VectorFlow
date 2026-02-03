import { useState, useCallback } from 'react';
import { Node } from 'reactflow';


interface ClipboardData {
  type: 'nodes' | 'deliverable';
  data: any;
}

interface PasteCallbacks {
  onPasteNodes: (newNodes: Node[]) => void;
  onPasteDeliverable: (targetNodeId: string, deliverable: any) => void;
  onError: (message: string) => void;
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const copy = useCallback((nodes: Node[], selectedDeliverableId: string | null) => {
    // 1. Copy Deliverable
    if (selectedDeliverableId) {
      // Find the deliverable
      let foundDeliverable: any = null;
      let sourceNodeId: string | null = null;

      for (const node of nodes) {
        if (Array.isArray(node.data.deliverables)) {
          const found = node.data.deliverables.find((d: any) => d.id === selectedDeliverableId);
          if (found) {
            foundDeliverable = found;
            sourceNodeId = node.id;
            break;
          }
        }
      }

      if (foundDeliverable) {
        const payload: ClipboardData = {
          type: 'deliverable',
          data: JSON.parse(JSON.stringify(foundDeliverable)) // Deep copy
        };
        setClipboard(payload);
        return { ...payload, count: 1 };
      }
    }

    // 2. Copy Nodes
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length > 0) {
      // Deep copy nodes to detach references
      const nodesData = JSON.parse(JSON.stringify(selectedNodes));
      const payload: ClipboardData = {
        type: 'nodes',
        data: nodesData
      };
      setClipboard(payload);
      return { ...payload, count: selectedNodes.length };
    }

    return null;
  }, []);

  const paste = useCallback((
    currentNodes: Node[], // Used for ID check or just context
    selectedNodes: Node[], // Used to identify target for deliverable paste
    callbacks: PasteCallbacks,
    explicitData?: ClipboardData
  ) => {
    const dataToPaste = explicitData || clipboard;
    if (!dataToPaste) return;

    if (dataToPaste.type === 'nodes') {
      const nodesToPaste = dataToPaste.data as Node[];
      
      // Map old IDs to new IDs to preserve potential internal references (like groups)
      const idMap = new Map<string, string>();
      nodesToPaste.forEach(node => {
        idMap.set(node.id, `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      });

      const newNodes = nodesToPaste.map(node => {
        const newId = idMap.get(node.id)!;
        
        // Handle Parent/Child relationship preservation
        // If the parent is ALSO being pasted, map to the NEW parent ID.
        // If the parent is NOT being pasted, keep the OLD parent ID (paste into same group).
        let newParentId = node.parentNode;
        if (node.parentNode && idMap.has(node.parentNode)) {
            newParentId = idMap.get(node.parentNode);
        }

        return {
          ...node,
          id: newId,
          parentNode: newParentId,
          position: {
            x: node.position.x + 50, // Offline offset
            y: node.position.y + 50
          },
          selected: true, // Select the new copies
          data: {
            ...node.data,
            // Ensure deliverables have new IDs too
            deliverables: Array.isArray(node.data.deliverables) 
              ? node.data.deliverables.map((d: any) => ({
                  ...d,
                  id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                })) 
              : []
          }
        };
      });

      callbacks.onPasteNodes(newNodes);

    } else if (dataToPaste.type === 'deliverable') {
      // Paste Deliverable
      // Requires exactly one target node to be selected
      if (selectedNodes.length !== 1) {
        callbacks.onError("Select a single step to paste the deliverable.");
        return;
      }

      const targetNode = selectedNodes[0];
      if (targetNode.type === 'group') {
          callbacks.onError("Cannot paste deliverable into a group.");
          return;
      }

      const deliverableData = {
          ...dataToPaste.data,
          id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      callbacks.onPasteDeliverable(targetNode.id, deliverableData);
    }
  }, [clipboard]);

  return { clipboard, copy, paste };
}
