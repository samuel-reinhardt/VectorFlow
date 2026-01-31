'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  useReactFlow,
  useNodesInitialized,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutGrid } from 'lucide-react';

import { Sidebar, SidebarHeader, SidebarContent } from '@/components/ui/layout/sidebar';
import { SettingsPanel } from '@/components/settings-panel';
import CustomNode from '@/components/custom-node';
import GroupNode from '@/components/group-node';
import { useVectorFlow } from '@/hooks/use-vector-flow';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { Outline } from '@/components/outline';
import { FlowTabs } from '@/components/flow-tabs';
import { useMediaQuery } from '@/hooks/use-media-query';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 150 }, data: { label: 'Welcome to VectorFlow!', color: '#F3F4F6' }, type: 'custom', style: { width: 220, height: 'auto' } },
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'This is a step', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 'auto' } },
  { id: '3', position: { x: 400, y: 250 }, data: { label: 'Connect them!', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 'auto' } },
  { id: '4', position: { x: 250, y: 350 }, data: { label: 'Auto-Arrange', color: '#E5E7EB' }, type: 'custom', style: { width: 220, height: 'auto' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, label: '', style: { stroke: '#6B7280' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, label: '', style: { stroke: '#6B7280' } },
];

const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
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
        flows,
        activeFlowId,
        switchFlow,
        addFlow,
        updateFlowTitle,
        selectedDeliverableId, // Destructure new state
        handleUpdateDeliverable, // Destructure new handler
        selectDeliverable, // Destructure new handler
    } = useVectorFlow(initialNodes, initialEdges);

    const { fitView, getNode, getNodes, setEdges } = useReactFlow();

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [rightSidebarInfo, setRightSidebarInfo] = useState({ title: 'Controls', description: 'Manage your graph.' });

    useEffect(() => {
        // Set initial state based on viewport, once isDesktop is determined.
        if (isDesktop === true) {
            setLeftSidebarOpen(true);
            setRightSidebarOpen(true);
        } else if (isDesktop === false) {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
        }
    }, [isDesktop]);

    const handleLeftSidebarToggle = useCallback(() => setLeftSidebarOpen(p => !p), []);
    const handleRightSidebarToggle = useCallback(() => setRightSidebarOpen(p => !p), []);
    
    const handleLeftSidebarChange = useCallback((open: boolean) => {
        // The Sheet component is for mobile only. It calls onOpenChange on outside clicks.
        // We only want this behavior on mobile.
        if (isDesktop === false) {
            setLeftSidebarOpen(open);
        }
    }, [isDesktop]);

    const handleRightSidebarChange = useCallback((open: boolean) => {
        if (isDesktop === false) {
            setRightSidebarOpen(open);
        }
    }, [isDesktop]);

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

    const nodesInitialized = useNodesInitialized();
    const [initialFitDone, setInitialFitDone] = useState(false);

    useEffect(() => {
        // Initial auto-layout ONLY once on mount after desktop state is known
        if (isDesktop !== null && !initialFitDone && getNodes().length > 0) {
            handleAutoLayout({ silent: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop]);

    // Reliable fitView once nodes are MEASURED by the DOM
    useEffect(() => {
        if (isDesktop !== null && nodesInitialized && !initialFitDone) {
            const timer = setTimeout(() => {
                fitView({ duration: 600 });
                setInitialFitDone(true);
            }, 200); // Small buffer for CSS variables/animations
            return () => clearTimeout(timer);
        }
    }, [isDesktop, nodesInitialized, initialFitDone, fitView]);

    const selectedStepId = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0].id : null, [selectedNodes]);

    // Inject handlers and state into node data
    const nodesWithData = useMemo(() => {
        return nodes.map(node => {
            if (node.type === 'custom') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        selectedDeliverableId,
                        onSelectDeliverable: (nodeId: string, id: string | null) => {
                            if (id) {
                                // Explicitly select the node to ensure Sidebar updates
                                setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
                            }
                            selectDeliverable(id);
                        },
                        onReorderDeliverables: (nodeId: string, items: any[]) => {
                            // We need a handler for this in useVectorFlow, or just update directly here?
                            // Ideally useVectorFlow exposes a specific handler. 
                            // For now, let's assume updateStep (or similar) or create a new one.
                            // Actually, I should probably reuse handleUpdateDeliverable, but that's for properties.
                            // I need to update the WHOLE deliverables list.
                            // Let's use setNodes for reordering for now or call a new handler effectively.
                             setNodes((nds) => nds.map((n) => {
                                if (n.id === nodeId) {
                                    return { ...n, data: { ...n.data, deliverables: items } };
                                }
                                return n;
                            }));
                        }
                    }
                };
            }
            return node;
        });
    }, [nodes, selectedDeliverableId, selectDeliverable, setNodes]);

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
            <Header />
            
            <Toolbar 
                onLeftSidebarToggle={handleLeftSidebarToggle}
                onRightSidebarToggle={handleRightSidebarToggle}
                onAutoLayout={() => handleAutoLayout({ silent: false })}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar side="left" open={leftSidebarOpen} onOpenChange={handleLeftSidebarChange} isDesktop={isDesktop}>
                    <Outline 
                        nodes={nodes} 
                        selectedStepId={selectedStepId} 
                        onStepSelect={handleStepSelect}
                        onDeliverableSelect={(nodeId, deliverableId) => {
                            handleStepSelect(nodeId);
                            selectDeliverable(deliverableId);
                        }} 
                    />
                </Sidebar>

                <main className="relative flex-1 h-full">
                    <ReactFlow
                        nodes={nodesWithData}
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
                
                <Sidebar side="right" open={rightSidebarOpen} onOpenChange={handleRightSidebarChange} isDesktop={isDesktop}>
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
                            selectedDeliverableId={selectedDeliverableId}
                            onAddStep={addStep}
                            onAddDeliverable={addDeliverable}
                            onUpdateStepLabel={updateStepLabel}
                            onUpdateStepColor={updateStepColor}
                            onUpdateEdgeLabel={updateEdgeLabel}
                            onUpdateEdgeColor={updateEdgeColor}
                            onUpdateDeliverable={handleUpdateDeliverable}
                            onDeleteSelection={deleteSelection}
                            onGroupSelection={groupSelection}
                            onUngroup={ungroupSelection}
                            onTitleChange={handleSettingsPanelTitleChange}
                        />
                    </SidebarContent>
                </Sidebar>
            </div>
            
            <FlowTabs
                flows={flows}
                activeFlowId={activeFlowId}
                onSwitchFlow={switchFlow}
                onAddFlow={addFlow}
                onUpdateFlowTitle={updateFlowTitle}
            />
        </div>
    );
}
