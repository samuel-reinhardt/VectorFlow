import { useCallback } from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';
import { useToast } from '@/hooks/use-toast';
import { DIMENSIONS } from '@/lib/constants';

/**
 * Hook for managing flow layout and node resizing logic.
 */
export function useNodeLayout(
  setNodes: (value: Node[] | ((prev: Node[]) => Node[])) => void,
  getNodes: () => Node[],
  getEdges: () => Edge[]
) {
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  const getNodeSize = useCallback((node: Node) => {
    const width = node.width || (node.style?.width as number) || DIMENSIONS.STEP_WIDTH;
    const deliverables = node.data.deliverables || [];
    const height = node.height || (node.style?.height as number) || 
      (DIMENSIONS.STEP_HEADER_HEIGHT + 
       (deliverables.length * DIMENSIONS.DELIVERABLE_HEIGHT) + 
       DIMENSIONS.DELIVERABLE_Y_PADDING);
    return { width, height };
  }, []);

  const autoResizeGroups = useCallback((currentNodes: Node[]): Node[] => {
    const groups = currentNodes.filter(n => n.type === 'group');
    if (groups.length === 0) return currentNodes;

    let nextNodes = [...currentNodes];
    let anyGroupChanged = false;

    groups.forEach(group => {
      const children = nextNodes.filter(c => c.parentNode === group.id);
      if (children.length > 0) {
        const padding = 60;
        const bounds = children.reduce(
          (acc, child) => {
            const { width, height } = getNodeSize(child);
            return {
              minX: Math.min(acc.minX, child.position.x),
              minY: Math.min(acc.minY, child.position.y),
              maxX: Math.max(acc.maxX, child.position.x + width),
              maxY: Math.max(acc.maxY, child.position.y + height),
            };
          },
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        // Calculate how much we need to shift the parent relative to current (0,0)
        const shiftX = bounds.minX - padding;
        const shiftY = bounds.minY - padding;

        const newWidth = (bounds.maxX - bounds.minX) + padding * 2;
        const newHeight = (bounds.maxY - bounds.minY) + padding * 2;

        const gIdx = nextNodes.findIndex(n => n.id === group.id);
        const currentGroup = nextNodes[gIdx];
        const currentWidth = (currentGroup.style?.width as number) || 0;
        const currentHeight = (currentGroup.style?.height as number) || 0;

        if (Math.abs(shiftX) > 1 || Math.abs(shiftY) > 1 || 
            Math.abs(currentWidth - newWidth) > 1 || 
            Math.abs(currentHeight - newHeight) > 1) {
          
          anyGroupChanged = true;
          
          // 1. Move the group and resize it
          nextNodes[gIdx] = {
            ...currentGroup,
            position: {
              x: currentGroup.position.x + shiftX,
              y: currentGroup.position.y + shiftY,
            },
            style: { ...currentGroup.style, width: newWidth, height: newHeight },
          };

          // 2. Shift all children back to maintain their absolute position
          nextNodes = nextNodes.map(n => {
            if (n.parentNode === group.id) {
              return {
                ...n,
                position: {
                  x: n.position.x - shiftX,
                  y: n.position.y - shiftY,
                }
              };
            }
            return n;
          });
        }
      }
    });

    return anyGroupChanged ? nextNodes : currentNodes;
  }, [getNodeSize]);

  const handleAutoLayout = useCallback((options?: { silent: boolean }) => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    if (allNodes.length === 0) {
      if (!options?.silent) {
        toast({
          title: "No steps to arrange",
          description: "Add some steps to the canvas first.",
        });
      }
      return;
    }

    const topLevelNodes = allNodes.filter(node => !node.parentNode);
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    
    const getLayoutNodeId = (nodeId: string): string => {
        let current = nodeMap.get(nodeId);
        while (current?.parentNode) {
            current = nodeMap.get(current.parentNode);
        }
        return current?.id || nodeId;
    };

    const adj = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    topLevelNodes.forEach(node => {
        adj.set(node.id, new Set());
        inDegree.set(node.id, 0);
    });

    allEdges.forEach(edge => {
        const sourceLayoutId = getLayoutNodeId(edge.source);
        const targetLayoutId = getLayoutNodeId(edge.target);

        if (sourceLayoutId !== targetLayoutId && adj.has(sourceLayoutId) && adj.has(targetLayoutId)) {
             if (!adj.get(sourceLayoutId)!.has(targetLayoutId)) {
                adj.get(sourceLayoutId)!.add(targetLayoutId);
                inDegree.set(targetLayoutId, (inDegree.get(targetLayoutId) || 0) + 1);
            }
        }
    });
    
    const queue: string[] = [];
    topLevelNodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
            queue.push(node.id);
        }
    });

    const columns: string[][] = [];
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentColumn: string[] = [];
        for (let i = 0; i < levelSize; i++) {
            const u = queue.shift()!;
            currentColumn.push(u);
            (Array.from(adj.get(u) || [])).forEach(v => {
                const newDegree = (inDegree.get(v) || 1) - 1;
                inDegree.set(v, newDegree);
                if (newDegree === 0) queue.push(v);
            });
        }
        columns.push(currentColumn);
    }
    
    const visitedNodes = new Set(columns.flat());
    const remainingNodes = topLevelNodes.filter(node => !visitedNodes.has(node.id));
    if (remainingNodes.length > 0) {
        columns.push(remainingNodes.map(node => node.id));
        if (!options?.silent) {
          toast({
              variant: "destructive",
              title: "Cyclic Dependency Detected",
              description: "Some steps form a loop and have been placed in the last column.",
          });
        }
    }

    const vSpacing = 50;
    const newNodes = allNodes.map(n => ({ ...n }));
    let currentX = 0;

    columns.forEach((column, index) => {
        const columnWidth = Math.max(...column.map(nodeId => {
            const node = allNodes.find(n => n.id === nodeId);
            return node ? getNodeSize(node).width : DIMENSIONS.STEP_WIDTH;
        }));

        const columnHeight = column.reduce((sum, nodeId) => {
            const node = allNodes.find(n => n.id === nodeId);
            return sum + (node ? getNodeSize(node).height : DIMENSIONS.STEP_INITIAL_HEIGHT) + vSpacing;
        }, -vSpacing);

        let currentY = -columnHeight / 2;

        column.forEach((nodeId) => {
            const node = newNodes.find(n => n.id === nodeId);
            if (node) {
                const { width: nodeWidth, height: nodeHeight } = getNodeSize(node);
                node.position = { x: currentX + (columnWidth - nodeWidth) / 2, y: currentY };
                currentY += nodeHeight + vSpacing;
            }
        });

        let nextHSpacing = 100;
        if (index < columns.length - 1) {
            const currentColumnNodes = new Set(column);
            const nextColumnNodes = new Set(columns[index + 1]);
            const hasEdgeContent = allEdges.some(edge => {
                const sourceLayoutId = getLayoutNodeId(edge.source);
                const targetLayoutId = getLayoutNodeId(edge.target);
                return currentColumnNodes.has(sourceLayoutId) && 
                       nextColumnNodes.has(targetLayoutId) && 
                       (edge.label || edge.data?.icon);
            });
            if (hasEdgeContent) nextHSpacing = 200;
        }
        currentX += columnWidth + nextHSpacing;
    });

    setNodes(newNodes);
    if (!options?.silent) {
      toast({ title: "Layout Arranged", description: "Steps have been arranged from left to right." });
      setTimeout(() => fitView({ duration: 500 }), 100);
    }
  }, [getNodes, getEdges, setNodes, fitView, toast, getNodeSize]);

  return {
    getNodeSize,
    autoResizeGroups,
    handleAutoLayout,
  };
}
