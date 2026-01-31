'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { Loader2, BrainCircuit, Orbit } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { arrangeLayoutAction } from '@/app/actions';
import { SettingsPanel } from '@/components/settings-panel';
import CustomNode from '@/components/custom-node';
import { useToast } from '@/hooks/use-toast';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 150 }, data: { label: 'Welcome to VectorFlow!', color: '#A9B388' }, type: 'custom' },
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'This is a node', color: '#739072' }, type: 'custom' },
  { id: '3', position: { x: 400, y: 250 }, data: { label: 'Connect them!', color: '#739072' }, type: 'custom' },
  { id: '4', position: { x: 250, y: 350 }, data: { label: 'Arrange with AI', color: '#739072' }, type: 'custom' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

const nodeTypes = {
  custom: CustomNode,
};

export function VectorFlow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isArranging, setIsArranging] = useState(false);
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
  }, []);

  const addNode = useCallback(() => {
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      position: {
        x: Math.random() * window.innerWidth * 0.4,
        y: Math.random() * window.innerHeight * 0.4,
      },
      data: { label: 'New Node', color: '#739072' },
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

  const handleArrangeLayout = useCallback(async () => {
    if (nodes.length <= 1) {
      toast({
        title: "Not enough nodes",
        description: "Add more nodes to arrange the layout.",
      });
      return;
    }
    setIsArranging(true);
    const layoutNodes = nodes.map(({ id, data }) => ({
      id,
      label: data.label || '',
    }));
    const layoutEdges = edges.map(({ source, target }) => ({ source, target }));
    
    const result = await arrangeLayoutAction({ nodes: layoutNodes, edges: layoutEdges });
    
    if (result.success && result.data) {
      const suggestedLayout = result.data;
      const newNodes = nodes.map(node => {
        const layoutNode = suggestedLayout.find(n => n.id === node.id);
        return layoutNode ? { ...node, position: { x: layoutNode.x, y: layoutNode.y } } : node;
      });
      setNodes(newNodes);
      toast({
        title: "Layout Arranged",
        description: "The AI has optimized your node layout.",
      });
      setTimeout(() => fitView({ duration: 500 }), 100);
    } else {
      toast({
        variant: "destructive",
        title: "Arrangement Failed",
        description: result.error,
      });
    }
    setIsArranging(false);
  }, [nodes, edges, toast, fitView]);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
      <header className="flex items-center justify-between p-4 border-b border-border shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Orbit className="text-primary h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold text-primary">
            VectorFlow
          </h1>
        </div>
        <Button onClick={handleArrangeLayout} disabled={isArranging}>
          {isArranging ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          {isArranging ? 'Arranging...' : 'Arrange with AI'}
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 h-full">
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
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </main>
        <SettingsPanel 
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateLabel={updateNodeLabel}
          onUpdateColor={updateNodeColor}
        />
      </div>
    </div>
  );
}
