'use client';

import { useState, useMemo } from 'react';
import type { Node } from 'reactflow';
import { useReactFlow } from 'reactflow';
import { ListTree, Search, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { SidebarHeader, SidebarContent } from '@/components/ui/layout/sidebar';
import { cn } from '@/lib/utils';

type TreeNode = Node & { children: TreeNode[]; level: number };

interface OutlineProps {
  nodes: Node[];
  selectedStepId: string | null;
  onStepSelect: (nodeId: string) => void;
  onDeliverableSelect: (nodeId: string, deliverableId: string) => void;
}

export function Outline({ nodes, selectedStepId, onStepSelect, onDeliverableSelect }: OutlineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { getNodes } = useReactFlow();

  const nodeTree = useMemo(() => {
    const allNodes = getNodes();
    // Build initial map, associating nodes with potential children
    // Nodes can have children (other nodes) AND deliverables (internal items)
    const nodesById = new Map(
      allNodes.map((node) => [node.id, { ...node, children: [] as TreeNode[], deliverables: node.data.deliverables || [] }])
    );

    // Link graph children
    for (const node of nodesById.values()) {
      if (node.parentNode && nodesById.has(node.parentNode)) {
        nodesById.get(node.parentNode)!.children.push(node as unknown as TreeNode);
      }
    }

    const roots = allNodes.filter((n) => !n.parentNode);
    const flatList: (TreeNode | { type: 'deliverable', id: string, label: string, parentId: string, level: number })[] = [];

    function traverse(nodes: Node[], level: number) {
      for (const node of nodes) {
        // We know nodesById has this node. Cast to unknown first if needed to satisfy TS or type it properly.
        // The object in nodesById has 'children' but not 'level' yet.
        // We add 'level' when pushing to flatList.
        const fullNode = nodesById.get(node.id)!;
        
        flatList.push({ ...fullNode, level } as TreeNode);
        
        // Add deliverables immediately after the node
        if (fullNode.data.deliverables && fullNode.data.deliverables.length > 0) {
            fullNode.data.deliverables.forEach((d: any) => {
                flatList.push({
                    type: 'deliverable',
                    id: d.id,
                    label: d.label,
                    parentId: node.id,
                    level: level + 1
                } as any);
            });
        }

        if (fullNode.children.length > 0) {
          // Sort children by x-position, then y-position
          fullNode.children.sort((a, b) => {
            if (a.position.x !== b.position.x) return a.position.x - b.position.x;
            return a.position.y - b.position.y;
          });
          traverse(fullNode.children as unknown as Node[], level + 1);
        }
      }
    }
    // Sort roots
    roots.sort((a, b) => {
        if (a.position.x !== b.position.x) return a.position.x - b.position.x;
        return a.position.y - b.position.y;
    });
    traverse(roots, 0);
    return flatList;
  }, [getNodes, nodes]);

  const filteredNodes = nodeTree.filter((item: any) => {
      const label = item.type === 'deliverable' ? item.label : item.data.label;
      return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center gap-2 mb-2">
          <ListTree className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Outline</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter steps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 h-9"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {filteredNodes.length > 0 ? (
          <ul className="space-y-1">
            {filteredNodes.map((item: any) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-left h-auto py-2 px-3 whitespace-normal',
                    item.id === selectedStepId // Highlight parent if selected? Or separate highlight for deliverables?
                      // We don't have selectedDeliverableID passed here yet, but we can assume parent selection logic for now
                      // The active deliverable selection logic resides in VectorFlow -> onDeliverableSelect -> useVectorFlow
                      // We might need to pass selectedDeliverableId to Outline to highlight it correctly
                      ? 'bg-accent text-accent-foreground'
                      : '',
                    item.type === 'deliverable' ? 'text-xs text-muted-foreground' : 'text-sm font-medium'
                  )}
                  style={{ paddingLeft: `${0.75 + item.level * 1.25}rem` }}
                  onClick={() => {
                      if (item.type === 'deliverable') {
                          onDeliverableSelect(item.parentId, item.id);
                      } else {
                          onStepSelect(item.id);
                      }
                  }}
                >
                  {item.type !== 'deliverable' && (item.children?.length > 0 || item.data?.deliverables?.length > 0) && (
                    <ChevronRight className="h-4 w-4 mr-1 shrink-0" />
                  )}
                  <span className="truncate">{item.type === 'deliverable' ? item.label : item.data.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No steps found.
          </p>
        )}
      </SidebarContent>
    </div>
  );
}
