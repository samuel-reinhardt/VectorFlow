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
    const styleWidth = typeof node.style?.width === 'number' ? node.style.width : parseFloat(node.style?.width as string);
    const width = node.width || (isNaN(styleWidth) ? null : styleWidth) || DIMENSIONS.STEP_WIDTH;
    
    const deliverables = node.data.deliverables || [];
    const styleHeight = typeof node.style?.height === 'number' ? node.style.height : parseFloat(node.style?.height as string);
    const height = node.height || (isNaN(styleHeight) ? null : styleHeight) || 
      (DIMENSIONS.STEP_HEADER_HEIGHT + 
       (deliverables.length * DIMENSIONS.DELIVERABLE_HEIGHT) + 
       DIMENSIONS.DELIVERABLE_Y_PADDING);
       
    return { width, height };
  }, []);

  const getGroupHeaderHeight = useCallback((node: Node) => {
    // If we have a measured height from the DOM, use it!
    if (node.data.headerHeight) {
        return node.data.headerHeight + 12; // 12px gap below header
    }

    const label = node.data.label || 'Group';
    const desc = node.data.shortDescription || '';
    
    // Fallback: top spacing (12px) + label row (approx 24px)
    let height = 36; 
    
    if (desc) {
      const charsPerLine = 40; 
      const lines = Math.max(1, Math.ceil(desc.length / charsPerLine));
      height += 2 + (lines * 14) + 12;
    }
    
    return height;
  }, []);

  const autoResizeGroups = useCallback((currentNodes: Node[]): Node[] => {
    const groups = currentNodes.filter(n => n.type === 'group');
    if (groups.length === 0) return currentNodes;

    let nextNodes = [...currentNodes];
    let anyGroupChanged = false;

    groups.forEach(group => {
      const children = nextNodes.filter(c => c.parentNode === group.id);
      if (children.length > 0) {
        const sidePadding = 40;
        const topPadding = getGroupHeaderHeight(group);
        const bottomPadding = 32;

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
        const shiftX = bounds.minX - sidePadding;
        const shiftY = bounds.minY - topPadding;

        const newWidth = (bounds.maxX - bounds.minX) + sidePadding * 2;
        const newHeight = (bounds.maxY - bounds.minY) + topPadding + bottomPadding;

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

    const vSpacing = 50;

    // Core layout algorithm for a set of nodes
    const arrangeLevel = (nodesToArrange: Node[], edgesToConsider: Edge[], isTopLevel: boolean): Node[] => {
        if (nodesToArrange.length === 0) return [];

        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        
        // Helper to get the ID for adjacency (only within this level)
        const getLayoutId = (nodeId: string): string | null => {
            let current = nodeMap.get(nodeId);
            if (!current) return null;
            if (!isTopLevel) return nodesToArrange.some(n => n.id === nodeId) ? nodeId : null;
            while (current?.parentNode) {
                const parent = nodeMap.get(current.parentNode);
                if (!parent) break;
                current = parent;
            }
            return nodesToArrange.some(n => n.id === current!.id) ? current!.id : null;
        };

        const getLabelWidth = (edge: Edge) => {
            const label = edge.label || '';
            const textWidth = typeof label === 'string' ? label.length * 6 : 0;
            const iconWidth = edge.data?.icon ? 20 : 0;
            return textWidth + iconWidth;
        };

        const adj = new Map<string, Set<string>>();
        const inDegree = new Map<string, number>();

        nodesToArrange.forEach(node => {
            adj.set(node.id, new Set());
            inDegree.set(node.id, 0);
        });

        allEdges.forEach(edge => {
            const sourceLayoutId = getLayoutId(edge.source);
            const targetLayoutId = getLayoutId(edge.target);

            if (sourceLayoutId && targetLayoutId && sourceLayoutId !== targetLayoutId && adj.has(sourceLayoutId) && adj.has(targetLayoutId)) {
                 if (!adj.get(sourceLayoutId)!.has(targetLayoutId)) {
                    adj.get(sourceLayoutId)!.add(targetLayoutId);
                    inDegree.set(targetLayoutId, (inDegree.get(targetLayoutId) || 0) + 1);
                }
            }
        });
        
        const queue: string[] = [];
        nodesToArrange.forEach(node => {
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
        const remainingNodes = nodesToArrange.filter(node => !visitedNodes.has(node.id));
        if (remainingNodes.length > 0) {
            columns.push(remainingNodes.map(node => node.id));
        }

        const resultNodes = nodesToArrange.map(n => ({ ...n }));
        let currentX = 0;

        columns.forEach((column, index) => {
            const columnWidth = Math.max(...column.map(nodeId => {
                const node = nodesToArrange.find(n => n.id === nodeId);
                return node ? getNodeSize(node).width : DIMENSIONS.STEP_WIDTH;
            }));

            const columnHeight = column.reduce((sum, nodeId) => {
                const node = nodesToArrange.find(n => n.id === nodeId);
                return sum + (node ? getNodeSize(node).height : DIMENSIONS.STEP_INITIAL_HEIGHT) + vSpacing;
            }, -vSpacing);

            let currentY = -columnHeight / 2;

            column.forEach((nodeId) => {
                const node = resultNodes.find(n => n.id === nodeId);
                if (node) {
                    const { width: nodeWidth, height: nodeHeight } = getNodeSize(node);
                    
                    let yOffset = 0;
                    if (node.type === 'group') {
                        const topPadding = getGroupHeaderHeight(node);
                        const bottomPadding = 32; 
                        yOffset = (bottomPadding - topPadding) / 2;
                    }

                    node.position = { 
                        x: currentX + (columnWidth - nodeWidth) / 2, 
                        y: currentY + yOffset 
                    };
                    currentY += nodeHeight + vSpacing;
                }
            });

            if (index < columns.length - 1) {
                const currentColumnNodes = new Set(column);
                const nextColumnNodes = new Set(columns[index + 1]);
                
                let maxLabelWidth = 0;
                allEdges.forEach(edge => {
                    const s = getLayoutId(edge.source);
                    const t = getLayoutId(edge.target);
                    if (s && t && currentColumnNodes.has(s) && nextColumnNodes.has(t)) {
                        maxLabelWidth = Math.max(maxLabelWidth, getLabelWidth(edge));
                    }
                });

                const baseHSpacing = isTopLevel ? 100 : 60;
                const labelPadding = maxLabelWidth > 0 ? 100 : 0;
                const nextHSpacing = Math.max(baseHSpacing, maxLabelWidth + labelPadding);
                
                currentX += columnWidth + nextHSpacing;
            }
        });

        return resultNodes;
    };

    let processedNodes = [...allNodes];

    // 1. Recursive child arrangement
    const layoutGroups = (parentId: string | undefined) => {
        const children = processedNodes.filter(n => n.parentNode === parentId);
        const groups = children.filter(n => n.type === 'group');

        // Recursively handle nested groups first (bottom-up)
        groups.forEach(g => layoutGroups(g.id));

        // Arrange children of this level
        if (parentId) {
            const levelNodes = processedNodes.filter(n => n.parentNode === parentId);
            
            // For internal group layout, we only care about edges between these children
            const levelNodeIds = new Set(levelNodes.map(n => n.id));
            const levelEdges = allEdges.filter(e => levelNodeIds.has(e.source) && levelNodeIds.has(e.target));
            
            const arrangedChildren = arrangeLevel(levelNodes, levelEdges, false);
            
            // Merge back
            processedNodes = processedNodes.map(n => {
                const arranged = arrangedChildren.find(ac => ac.id === n.id);
                return arranged || n;
            });

            // Resize the parent group to fit its newly arranged children
            processedNodes = autoResizeGroups(processedNodes);
        }
    };

    // Find all top-level groups and start recursion
    allNodes.filter(n => n.type === 'group' && !n.parentNode).forEach(g => layoutGroups(g.id));

    // 2. Finally, arrange top-level elements
    const topLevelNodes = processedNodes.filter(n => !n.parentNode);
    const arrangedTopLevel = arrangeLevel(topLevelNodes, allEdges, true);

    // Merge everything together
    const finalNodes = processedNodes.map(n => {
        const arranged = arrangedTopLevel.find(atl => atl.id === n.id);
        return arranged || n;
    });

    setNodes(finalNodes);
    if (!options?.silent) {
      toast({ title: "Layout Arranged", description: "Entire flow and group contents have been organized." });
      setTimeout(() => fitView({ duration: 500 }), 100);
    }
  }, [getNodes, getEdges, setNodes, fitView, toast, getNodeSize, autoResizeGroups]);

  return {
    getNodeSize,
    autoResizeGroups,
    handleAutoLayout,
  };
}
