import { useCallback } from 'react';
import { Node } from 'reactflow';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing grouping and ungrouping operations.
 */
export function useGroupOperations(
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void,
  getNodes: () => Node[],
  autoResizeGroups: (nodes: Node[]) => Node[]
) {
  const { toast } = useToast();

  const groupSelection = useCallback(() => {
    const currentSelectedNodes = getNodes().filter(n => n.selected && !n.parentNode);
    if (currentSelectedNodes.length < 2) {
      toast({ 
        variant: 'destructive', 
        title: 'Cannot Group', 
        description: 'Select at least two top-level steps to group them.'
      });
      return;
    }

    const nodesHaveDimensions = currentSelectedNodes.every(n => n.width && n.height);
    if (!nodesHaveDimensions) {
        toast({
            variant: 'destructive',
            title: 'Cannot Group Yet',
            description: 'Still calculating step sizes. Please try again in a moment.'
        });
        return;
    }

    const padding = 60;
    const { minX, maxX, minY, maxY } = currentSelectedNodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x + node.width!),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y + node.height!),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    
    const parentId = `group_${Date.now()}`;
    const parentNode: Node = {
      id: parentId,
      type: 'group',
      data: { label: 'New Group', color: '#E5E7EB' },
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '12px',
        padding: 0,
      },
      className: '!border-0 !bg-transparent !p-0 !shadow-none !outline-none !ring-0',
      zIndex: 0,
    };

    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (currentSelectedNodes.some(sn => sn.id === n.id)) {
          return {
            ...n,
            parentNode: parentId,
            position: {
              x: n.position.x - parentNode.position.x,
              y: n.position.y - parentNode.position.y,
            },
            selected: false,
          };
        }
        return n;
      });
      return autoResizeGroups([parentNode, ...newNodes]);
    });
  }, [getNodes, setNodes, toast, autoResizeGroups]);

  const ungroupSelection = useCallback(() => {
    const selectedGroup = getNodes().find(n => n.selected && n.type === 'group');
    if (!selectedGroup) return;

    setNodes(nds => {
      const children = nds.filter(n => n.parentNode === selectedGroup.id);
      const updatedChildren = children.map(child => ({
        ...child,
        parentNode: undefined,
        extent: undefined,
        position: {
          x: selectedGroup.position.x + child.position.x,
          y: selectedGroup.position.y + child.position.y,
        }
      }));

      const childrenIds = new Set(children.map(c => c.id));
      const remainingNodes = nds.filter(n => n.id !== selectedGroup.id && !childrenIds.has(n.id));
      return [...updatedChildren, ...remainingNodes];
    });
  }, [getNodes, setNodes]);

  return {
    groupSelection,
    ungroupSelection,
  };
}
