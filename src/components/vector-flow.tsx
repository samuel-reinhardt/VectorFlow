
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  Node,
  Edge,
  OnConnect,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Orbit, ListTree, Search, LayoutGrid, Workflow, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { SettingsPanel } from '@/components/settings-panel';
import CustomNode from '@/components/custom-node';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 150 }, data: { label: 'Welcome to VectorFlow!', color: '#F3F4F6' }, type: 'custom' },
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'This is a step', color: '#E5E7EB' }, type: 'custom' },
  { id: '3', position: { x: 400, y: 250 }, data: { label: 'Connect them!', color: '#E5E7EB' }, type: 'custom' },
  { id: '4', position: { x: 250, y: 350 }, data: { label: 'Auto-Arrange', color: '#E5E7EB' }, type: 'custom' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, label: '', style: { stroke: '#6B7280' } },
];

const nodeTypes = {
  custom: CustomNode,
};

type TreeNode = Node & { children: TreeNode[], level: number };

function Outline({ nodes: flatNodes, selectedStepId, onStepSelect }: { nodes: Node[], selectedStepId: string | null, onStepSelect: (nodeId: string) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const { getNodes } = useReactFlow();

    const nodeTree = useMemo(() => {
        const allNodes = getNodes();
        const nodesById = new Map(allNodes.map(node => [node.id, { ...node, children: [] }]));
        
        for (const node of nodesById.values()) {
            if (node.parentNode && nodesById.has(node.parentNode)) {
                nodesById.get(node.parentNode)!.children.push(node);
            }
        }
        
        const roots = allNodes.filter(n => !n.parentNode);

        const flatList: TreeNode[] = [];
        function traverse(nodes: Node[], level: number) {
            for (const node of nodes) {
                const fullNode = nodesById.get(node.id)!;
                flatList.push({ ...fullNode, level });
                if (fullNode.children.length > 0) {
                    // Sort children by their y-position
                    fullNode.children.sort((a,b) => a.position.y - b.position.y);
                    traverse(fullNode.children, level + 1);
                }
            }
        }
        // Sort roots by their y-position
        roots.sort((a,b) => a.position.y - b.position.y);
        traverse(roots, 0);
        return flatList;
    }, [getNodes, flatNodes]);


    const filteredNodes = nodeTree.filter((node) => node.data.label.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <SidebarContent>
                <div className="p-2">
                {filteredNodes.length > 0 ? (
                    <ul className="space-y-1">
                    {filteredNodes.map((node) => (
                        <li key={node.id}>
                        <Button
                            variant="ghost"
                            className={cn(
                            'w-full justify-start text-left h-auto py-2 px-3 whitespace-normal text-sm',
                            node.id === selectedStepId ? 'bg-accent text-accent-foreground' : ''
                            )}
                            style={{ paddingLeft: `${0.75 + node.level * 1.25}rem` }}
                            onClick={() => onStepSelect(node.id)}
                        >
                            {node.children.length > 0 && <ChevronRight className="h-4 w-4 mr-1 shrink-0" />}
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
                </div>
            </SidebarContent>
        </div>
    )
}

export function VectorFlow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const { toast } = useToast();
  const { fitView, getNode, getNodes, getEdges } = useReactFlow();

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true, label: '', style: { stroke: '#6B7280' } }, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);
  
  const handleStepSelect = useCallback((nodeId: string) => {
    const nodeToSelect = getNode(nodeId);
    if (nodeToSelect) {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
        fitView({ nodes: [{id: nodeId}], duration: 300, maxZoom: 1.2 });
    }
  }, [getNode, setNodes, setEdges, fitView]);


  const addStep = useCallback(() => {
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: {
        x: Math.random() * window.innerWidth * 0.4,
        y: Math.random() * window.innerHeight * 0.4,
      },
      data: { label: 'New Step', color: '#E5E7EB' },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length]);

  const updateStepLabel = useCallback((stepId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, label } } : node
      )
    );
  }, [setNodes]);
  
  const updateStepColor = useCallback((stepId: string, color: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepId ? { ...node, data: { ...node.data, color } } : node
      )
    );
  }, [setNodes]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge))
    );
  }, [setEdges]);

  const updateEdgeColor = useCallback((edgeId: string, color: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, style: { ...edge.style, stroke: color } } : edge
      )
    );
  }, [setEdges]);

  const deleteSelection = useCallback(() => {
    const currentSelectedNodes = getNodes().filter(n => n.selected);
    const currentSelectedEdges = getEdges().filter(e => e.selected);

    if (currentSelectedNodes.length === 0 && currentSelectedEdges.length === 0) return;

    let nodeIdsToDelete = new Set(currentSelectedNodes.map(n => n.id));
    
    currentSelectedNodes.forEach(node => {
      if(node.data.isGroup) {
        getNodes().forEach(child => {
          if (child.parentNode === node.id) {
            nodeIdsToDelete.add(child.id);
          }
        });
      }
    });

    const edgeIdsToDelete = new Set(currentSelectedEdges.map(e => e.id));

    setNodes(nds => nds.filter(n => !nodeIdsToDelete.has(n.id)));
    setEdges(eds => eds.filter(e => !edgeIdsToDelete.has(e.id) && !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)));

    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [getNodes, getEdges, setNodes, setEdges]);
  
  const groupSelection = useCallback(() => {
    const currentSelectedNodes = getNodes().filter(n => n.selected && !n.parentNode);
    if (currentSelectedNodes.length < 2) {
      toast({ variant: 'destructive', title: 'Cannot Group', description: 'Select at least two top-level steps to group them.'});
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

    const padding = 50;
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
      type: 'custom',
      data: { label: 'New Group', color: '#E5E7EB', isGroup: true },
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      },
    };

    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (currentSelectedNodes.some(sn => sn.id === n.id)) {
          return {
            ...n,
            parentNode: parentId,
            extent: 'parent',
            position: {
              x: n.position.x - parentNode.position.x,
              y: n.position.y - parentNode.position.y,
            },
            selected: false,
          };
        }
        return n;
      });
      return [parentNode, ...newNodes];
    });

  }, [getNodes, setNodes, toast]);

  const ungroupSelection = useCallback(() => {
    const selectedGroup = getNodes().find(n => n.selected && n.data.isGroup);
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

      return [...remainingNodes, ...updatedChildren];
    });
  }, [getNodes, setNodes]);


  const handleAutoLayout = useCallback(() => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    if (allNodes.length === 0) {
      toast({
        title: "No steps to arrange",
        description: "Add some steps to the canvas first.",
      });
      return;
    }

    const topLevelNodes = allNodes.filter(node => !node.parentNode);
    const topLevelNodeIds = new Set(topLevelNodes.map(n => n.id));
    const topLevelEdges = allEdges.filter(e => topLevelNodeIds.has(e.source) && topLevelNodeIds.has(e.target));


    const nodeWidth = 176;
    const nodeHeight = 52;
    const hSpacing = 100;
    const vSpacing = 50;

    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    topLevelNodes.forEach(node => {
        adj.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    topLevelEdges.forEach(edge => {
        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
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

            (adj.get(u) || []).forEach(v => {
                const newDegree = (inDegree.get(v) || 1) - 1;
                inDegree.set(v, newDegree);
                if (newDegree === 0) {
                    queue.push(v);
                }
            });
        }
        columns.push(currentColumn);
    }
    
    const visitedNodes = new Set(columns.flat());
    const remainingNodes = topLevelNodes.filter(node => !visitedNodes.has(node.id));
    if (remainingNodes.length > 0) {
        columns.push(remainingNodes.map(node => node.id));
    }


    const newNodes = getNodes().map(n => ({ ...n }));

    columns.forEach((column, colIndex) => {
        const x = colIndex * (nodeWidth + hSpacing);
        const colHeight = column.length * (nodeHeight + vSpacing);
        const startY = (-(colHeight / 2)) + (nodeHeight / 2) ;

        column.forEach((nodeId, nodeIndex) => {
            const y = startY + nodeIndex * (nodeHeight + vSpacing);
            const node = newNodes.find(n => n.id === nodeId);
            if (node) {
                node.position = { x, y };
            }
        });
    });

    setNodes(newNodes);
    toast({
      title: "Layout Arranged",
      description: "Steps have been arranged from left to right.",
    });
    setTimeout(() => fitView({ duration: 500 }), 100);

  }, [getNodes, getEdges, setNodes, fitView, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoLayout();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedStepId = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0].id : null, [selectedNodes]);

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
        <header className="flex items-center justify-between p-4 border-b border-border shadow-sm z-10 bg-card">
          <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Orbit className="text-primary h-8 w-8" />
              <h1 className="text-2xl font-headline font-bold">
                  VectorFlow
              </h1>
          </div>
          <div className="flex items-center gap-2">
              <Button onClick={handleAutoLayout}>
                  <Workflow className="mr-2 h-4 w-4" />
                  Auto-Arrange
              </Button>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRightSidebarOpen(p => !p)}
                  className="hidden md:flex"
                  aria-label="Toggle settings panel"
              >
                  <LayoutGrid />
              </Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <Sidebar side="left" collapsible="icon">
                <Outline nodes={nodes} selectedStepId={selectedStepId} onStepSelect={handleStepSelect} />
            </Sidebar>

            <main className="relative flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                    deleteKeyCode={['Delete', 'Backspace']}
                >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                </ReactFlow>
            </main>
            
            <div className={cn("transition-[width] ease-in-out duration-300 overflow-x-hidden", isRightSidebarOpen ? 'w-80' : 'w-0')}>
              <div className="w-80 h-full">
                <SettingsPanel 
                  selectedSteps={selectedNodes}
                  selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
                  onAddStep={addStep}
                  onUpdateStepLabel={updateStepLabel}
                  onUpdateStepColor={updateStepColor}
                  onUpdateEdgeLabel={updateEdgeLabel}
                  onUpdateEdgeColor={updateEdgeColor}
                  onDeleteSelection={deleteSelection}
                  onGroupSelection={groupSelection}
                  onUngroup={ungroupSelection}
                />
              </div>
            </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
