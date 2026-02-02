'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Node } from 'reactflow';
import { ListTree, Search, ChevronRight, ChevronDown, Square, FileText, Layers, ChevronsUpDown } from 'lucide-react';
import { DynamicIcon } from '@/components/common/dynamic-icon';

import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { SidebarHeader, SidebarContent } from '@/components/ui/layout/sidebar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/overlay/tooltip';

type TreeNode = Node & { 
    children: TreeNode[]; 
    level: number;
    parentId?: string;
    type: string;
};

interface FlatNode {
  id: string;
  label: string;
  type: string;
  level: number;
  icon?: string;
  data: any;
  hasChildren: boolean;
  parentId?: string;
}

interface OutlineProps {
  nodes: Node[];
  selectedStepId: string | null;
  onStepSelect: (nodeId: string) => void;
  onDeliverableSelect: (nodeId: string, deliverableId: string) => void;
}

export function Outline({ nodes, selectedStepId, onStepSelect, onDeliverableSelect }: OutlineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // 1. Build the Hierarchical Tree Structure (independent of UI state like collapse/search)
  const treeRoots = useMemo(() => {
    // Map of all nodes enhanced with children array
    const nodesById = new Map(
      nodes.map((node) => [node.id, { ...node, children: [] as TreeNode[], deliverables: node.data.deliverables || [] }])
    );

    // Link graph children
    for (const node of nodesById.values()) {
      if (node.parentNode && nodesById.has(node.parentNode)) {
        nodesById.get(node.parentNode)!.children.push(node as unknown as TreeNode);
      }
    }

    // Identify roots
    const roots = nodes.filter((n) => !n.parentNode);

    // Helper to sort nodes by position
    const sortNodes = (nodeList: any[]) => {
      nodeList.sort((a, b) => {
        const posA = a.position || { x: 0, y: 0 };
        const posB = b.position || { x: 0, y: 0 };
        
        if (posA.x !== posB.x) return posA.x - posB.x;
        return posA.y - posB.y;
      });
    };

    // Recursive sort
    const sortTree = (nodeList: any[]) => {
      sortNodes(nodeList);
      nodeList.forEach(node => {
        const fullNode = nodesById.get(node.id)!;
        if (fullNode.children.length > 0) {
           sortTree(fullNode.children);
        }
      });
    };

    sortTree(roots);
    
    // Return roots with access to the full linkage via nodesById lookup if needed, 
    // but here we just need the roots populated with children structure.
    // We need to reconstruct the tree starting from roots using the modified nodes in nodesById
    const buildTree = (nodeList: Node[]): any[] => {
        return nodeList.map(n => {
            const fullNode = nodesById.get(n.id)!;
            return {
                ...fullNode,
                children: buildTree(fullNode.children as unknown as Node[])
            };
        });
    };

    return buildTree(roots);
  }, [nodes]);

  // 2. Flatten based on visibility (collapsed state) and filtering
  const visibleItems = useMemo(() => {
    const flatList: FlatNode[] = [];
    
    const traverse = (items: any[], level: number) => {
      for (const item of items) {
        // Check if matches search (if search is active)
        // Note: Simple search implementation: if search is active, we might flatten everything and filter.
        // Or we can keep hierarchy. Let's start with standard behavior: search filters the list, often ignoring collapse.
        
        const hasChildren = (item.children && item.children.length > 0) || 
                            (item.data.deliverables && item.data.deliverables.length > 0);
        
        const isCollapsed = collapsedIds.has(item.id);
        const matchesSearch = searchTerm === '' || 
           (item.type === 'deliverable' ? item.label : item.data.label).toLowerCase().includes(searchTerm.toLowerCase());

        // If searching, we skip the collapse check usually, or we only show matches.
        // Let's adopt logic: If searchTerm, show matches (flat). If no searchTerm, show tree.
        
        const node: FlatNode = {
            id: item.id,
            label: item.type === 'deliverable' ? item.label : item.data.label,
            type: item.type || 'step',
            level,
            icon: item.icon || item.data?.icon,
            data: item.data,
            hasChildren,
            parentId: item.parentId
        };

        if (searchTerm) {
             if (matchesSearch) flatList.push(node);
             // Verify children for search matches
             if (item.data.deliverables) {
                 item.data.deliverables.forEach((d: any) => {
                     if (d.label.toLowerCase().includes(searchTerm.toLowerCase())) {
                         flatList.push({
                             id: d.id,
                             label: d.label,
                             type: 'deliverable',
                             level: level + 1,
                             icon: d.icon,
                             data: {},
                             hasChildren: false,
                             parentId: item.id
                         });
                     }
                 });
             }
             if (item.children) {
                 traverse(item.children, level + 1);
             }
        } else {
            // Standard Tree View
            flatList.push(node);

            // Process children if not collapsed
            if (!isCollapsed) {
                // Deliverables first
                if (item.data.deliverables) {
                    item.data.deliverables.forEach((d: any) => {
                        flatList.push({
                            id: d.id,
                            label: d.label,
                            type: 'deliverable',
                            level: level + 1,
                            icon: d.icon,
                            data: {},
                            hasChildren: false,
                            parentId: item.id
                        });
                    });
                }
                
                // Then sub-steps
                if (item.children) {
                    traverse(item.children, level + 1);
                }
            }
        }
      }
    };

    traverse(treeRoots, 0);
    return flatList;
  }, [treeRoots, collapsedIds, searchTerm]);

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (collapsedIds.size > 0) {
        setCollapsedIds(new Set()); // Expand All
    } else {
        // Collapse All (add all IDs that have children)
        const allIds = new Set<string>();
        const collectIds = (items: any[]) => {
            items.forEach(item => {
                if ((item.children && item.children.length > 0) || (item.data.deliverables && item.data.deliverables.length > 0)) {
                    allIds.add(item.id);
                }
                if (item.children) collectIds(item.children);
            });
        };
        collectIds(treeRoots);
        setCollapsedIds(allIds);
    }
  };

  const areAllCollapsed = collapsedIds.size > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListTree className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Outline</h2>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleAll}>
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{areAllCollapsed ? 'Expand All' : 'Collapse All'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 h-8 text-xs"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        {visibleItems.length > 0 ? (
          <div className="py-1">
            {visibleItems.map((item) => {
                const isSelected = item.type === 'deliverable' 
                    ? false // Logic for highlighting deliverable is complicated without parent context in some selection modes, check parent comp
                    // Just assume normal selection for now
                    : item.id === selectedStepId;
                // Deliverable highlighting hack: passing selection logic via props would be better
                // But generally, the user wants to see what's active.

                return (
                  <div key={item.id} className="relative group">
                    {/* Indent Guides */}
                    {Array.from({ length: item.level }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-px h-full bg-border"
                        style={{ left: `${0.875 + i * 0.875}rem` }}
                      />
                    ))}

                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start text-left h-8 py-0 px-2 rounded-none relative hover:bg-muted/50 transition-colors',
                        isSelected ? 'bg-accent text-accent-foreground hover:bg-accent' : '',
                        item.type === 'deliverable' ? 'text-muted-foreground' : 'font-medium'
                      )}
                      style={{ paddingLeft: `${0.375 + item.level * 0.875}rem` }}
                      onClick={() => {
                          if (item.type === 'deliverable') {
                              onDeliverableSelect(item.parentId!, item.id);
                          } else {
                              onStepSelect(item.id);
                          }
                      }}
                    >
                      {/* Collapse Toggle */}
                      <span
                        role="button"
                        className={cn(
                            "flex items-center justify-center w-4 h-4 mr-1 rounded-sm hover:bg-muted-foreground/10 transition-colors z-10",
                            !item.hasChildren && "invisible"
                        )}
                        onClick={(e) => item.hasChildren && toggleCollapse(e, item.id)}
                      >
                        {collapsedIds.has(item.id) ? (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                      
                      {/* Icon */}
                      {item.type === 'deliverable' ? (
                        <DynamicIcon name={item.icon} fallback={FileText} className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                      ) : item.type === 'group' ? (
                        <DynamicIcon name={item.data?.icon} fallback={Layers} className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                      ) : (
                        <DynamicIcon name={item.data?.icon} fallback={Square} className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                      )}
                      
                      <span className="truncate text-xs">{item.label}</span>
                    </Button>
                  </div>
                );
            })}
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p className="text-sm">No items found</p>
            </div>
        )}
      </SidebarContent>
    </div>
  );
}
