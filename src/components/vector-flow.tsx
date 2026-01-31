
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
import { Orbit, ListTree, Search, LayoutGrid, Workflow } from 'lucide-react';
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
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'This is a node', color: '#E5E7EB' }, type: 'custom' },
  { id: '3', position: { x: 400, y: 250 }, data: { label: 'Connect them!', color: '#E5E7EB' }, type: 'custom' },
  { id: '4', position: { x: 250, y: 350 }, data: { label: 'Auto-Arrange', color: '#E5E7EB' }, type: 'custom' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

const nodeTypes = {
  custom: CustomNode,
};

function Outline({ nodes, selectedNodeId, onNodeSelect }: { nodes: Node[], selectedNodeId: string | null, onNodeSelect: (nodeId: string) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredNodes = nodes.filter((node) => node.data.label.toLowerCase().includes(searchTerm.toLowerCase()));

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
                        placeholder="Filter nodes..."
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
                            node.id === selectedNodeId ? 'bg-accent text-accent-foreground' : ''
                            )}
                            onClick={() => onNodeSelect(node.id)}
                        >
                            {node.data.label}
                        </Button>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                    No nodes found.
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const { toast } = useToast();
  const { fitView, getNode } = useReactFlow();

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
  }, []);
  
  const handleNodeSelect = useCallback((nodeId: string) => {
    const nodeToSelect = getNode(nodeId);
    if (nodeToSelect) {
        const newNodes = nodes.map(n => ({...n, selected: n.id === nodeId}));
        setNodes(newNodes);
        setSelectedNode(nodeToSelect);
        fitView({ nodes: [{id: nodeId}], duration: 300, maxZoom: 1.2 });
    }
  }, [getNode, setNodes, fitView, nodes]);


  const addNode = useCallback(() => {
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: {
        x: Math.random() * window.innerWidth * 0.4,
        y: Math.random() * window.innerHeight * 0.4,
      },
      data: { label: 'New Node', color: '#E5E7EB' },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length]);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
      )
    );
  }, []);
  
  const updateNodeColor = useCallback((nodeId: string, color: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, color } } : node
      )
    );
  }, []);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) {
      toast({
        title: "No nodes to arrange",
        description: "Add some nodes to the canvas first.",
      });
      return;
    }

    const nodeWidth = 150;
    const nodeHeight = 50;
    const hSpacing = 100;
    const vSpacing = 50;

    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(node => {
        adj.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    const queue: string[] = [];
    nodes.forEach(node => {
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
    const remainingNodes = nodes.filter(node => !visitedNodes.has(node.id));
    if (remainingNodes.length > 0) {
        columns.push(remainingNodes.map(node => node.id));
    }


    const newNodes = nodes.map(n => ({ ...n }));

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
      description: "Nodes have been arranged from left to right.",
    });
    setTimeout(() => fitView({ duration: 500 }), 100);

  }, [nodes, edges, setNodes, fitView, toast]);

  useEffect(() => {
    // Run auto-layout on initial load
    const timer = setTimeout(() => {
      handleAutoLayout();
    }, 100); // Small delay to ensure everything is ready

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  const selectedNodeId = useMemo(() => selectedNode?.id ?? null, [selectedNode]);

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
                <Outline nodes={nodes} selectedNodeId={selectedNodeId} onNodeSelect={handleNodeSelect} />
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
                  selectedNode={selectedNode}
                  onAddNode={addNode}
                  onUpdateLabel={updateNodeLabel}
                  onUpdateColor={updateNodeColor}
                />
              </div>
            </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
