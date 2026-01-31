'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutGrid } from 'lucide-react';

import { Sidebar, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { SettingsPanel } from '@/components/settings-panel';
import CustomNode from '@/components/custom-node';
import { useVectorFlow } from '@/hooks/use-vector-flow';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { Outline } from '@/components/outline';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 150 }, data: { label: 'Welcome to VectorFlow!', color: '#F3F4F6' }, type: 'custom', style: { width: 220, height: 60 } },
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'This is a step', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 60 } },
  { id: '3', position: { x: 400, y: 250 }, data: { label: 'Connect them!', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 60 } },
  { id: '4', position: { x: 250, y: 350 }, data: { label: 'Auto-Arrange', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 60 } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, label: '', style: { stroke: '#6B7280' } },
];

const nodeTypes = {
  custom: CustomNode,
};

export function VectorFlow() {
    const {
        nodes,
        edges,
        selectedNodes,
        selectedEdges,
        setNodes,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onSelectionChange,
        addStep,
        addDeliverable,
        updateStepLabel,
        updateStepColor,
        updateEdgeLabel,
        updateEdgeColor,
        deleteSelection,
        groupSelection,
        ungroupSelection,
        handleAutoLayout,
    } = useVectorFlow(initialNodes, initialEdges);

    const { fitView, getNode, getNodes, setEdges } = useReactFlow();

    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [rightSidebarInfo, setRightSidebarInfo] = useState({ title: 'Controls', description: 'Manage your graph.' });

    useEffect(() => {
        const isDesktop = window.innerWidth >= 768; // Tailwind's `md` breakpoint
        if (isDesktop) {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
        }
    }, []);

    const handleLeftSidebarToggle = useCallback(() => setLeftSidebarOpen(p => !p), []);
    const handleRightSidebarToggle = useCallback(() => setRightSidebarOpen(p => !p), []);
    
    const handleSettingsPanelTitleChange = useCallback((title: string, description: string) => {
        setRightSidebarInfo({ title, description });
    }, []);

    const handleStepSelect = useCallback((nodeId: string) => {
        const nodeToSelect = getNode(nodeId);
        if (nodeToSelect) {
            setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
            setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
            fitView({ nodes: [{id: nodeId}], duration: 300, maxZoom: 1.2 });
        }
    }, [getNode, setNodes, setEdges, fitView]);

    useEffect(() => {
        const timer = setTimeout(() => {
        if (getNodes().length > 0) {
            handleAutoLayout({ silent: true });
        }
        }, 100);
    
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedStepId = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0].id : null, [selectedNodes]);

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
            <Header onAutoLayout={() => handleAutoLayout({ silent: false })} />
            
            <Toolbar 
                onLeftSidebarToggle={handleLeftSidebarToggle}
                onRightSidebarToggle={handleRightSidebarToggle}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar side="left" open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
                    <Outline nodes={nodes} selectedStepId={selectedStepId} onStepSelect={handleStepSelect} />
                </Sidebar>

                <main className="relative flex-1 h-full">
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
                
                <Sidebar side="right" open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
                    <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">{rightSidebarInfo.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground h-8">{rightSidebarInfo.description}</p>
                    </SidebarHeader>
                    <SidebarContent className="p-4">
                        <SettingsPanel 
                            selectedSteps={selectedNodes}
                            selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
                            onAddStep={addStep}
                            onAddDeliverable={addDeliverable}
                            onUpdateStepLabel={updateStepLabel}
                            onUpdateStepColor={updateStepColor}
                            onUpdateEdgeLabel={updateEdgeLabel}
                            onUpdateEdgeColor={updateEdgeColor}
                            onDeleteSelection={deleteSelection}
                            onGroupSelection={groupSelection}
                            onUngroup={ungroupSelection}
                            onTitleChange={handleSettingsPanelTitleChange}
                        />
                    </SidebarContent>
                </Sidebar>
            </div>
        </div>
    );
}
