'use client';

import { useState, useMemo } from 'react';
import type { Node } from 'reactflow';
import { useReactFlow } from 'reactflow';
import { ListTree, Search, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type TreeNode = Node & { children: TreeNode[]; level: number };

interface OutlineProps {
  nodes: Node[];
  selectedStepId: string | null;
  onStepSelect: (nodeId: string) => void;
}

export function Outline({ nodes, selectedStepId, onStepSelect }: OutlineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { getNodes } = useReactFlow();

  const nodeTree = useMemo(() => {
    const allNodes = getNodes();
    const nodesById = new Map(
      allNodes.map((node) => [node.id, { ...node, children: [] as TreeNode[] }])
    );

    for (const node of nodesById.values()) {
      if (node.parentNode && nodesById.has(node.parentNode)) {
        nodesById.get(node.parentNode)!.children.push(node as TreeNode);
      }
    }

    const roots = allNodes.filter((n) => !n.parentNode);

    const flatList: TreeNode[] = [];
    function traverse(nodes: Node[], level: number) {
      for (const node of nodes) {
        const fullNode = nodesById.get(node.id)! as TreeNode;
        flatList.push({ ...fullNode, level });
        if (fullNode.children.length > 0) {
          // Sort children by their y-position
          fullNode.children.sort((a, b) => a.position.y - b.position.y);
          traverse(fullNode.children, level + 1);
        }
      }
    }
    // Sort roots by their y-position
    roots.sort((a, b) => a.position.y - b.position.y);
    traverse(roots, 0);
    return flatList;
  }, [getNodes, nodes]);

  const filteredNodes = nodeTree.filter((node) =>
    node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {filteredNodes.map((node) => (
              <li key={node.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-left h-auto py-2 px-3 whitespace-normal',
                    node.id === selectedStepId
                      ? 'bg-accent text-accent-foreground'
                      : '',
                    node.data.isDeliverable ? 'text-sm' : 'text-sm font-medium'
                  )}
                  style={{ paddingLeft: `${0.75 + node.level * 1.25}rem` }}
                  onClick={() => onStepSelect(node.id)}
                >
                  {node.children.length > 0 && (
                    <ChevronRight className="h-4 w-4 mr-1 shrink-0" />
                  )}
                  <span className="truncate">{node.data.label}</span>
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
