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
import { Plus, Trash2, Settings2, X, Grip, LayoutGrid, Square, FileText, Layers, Boxes, Share2 } from 'lucide-react';

import { Sidebar, SidebarHeader, SidebarContent } from '@/components/ui/layout/sidebar';
import { SettingsPanel } from '@/components/settings-panel';
import CustomNode from '@/components/custom-node';
import GroupNode from '@/components/group-node';
import { CustomEdge } from '@/components/custom-edge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { useVectorFlow } from '@/hooks/use-vector-flow';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { Outline } from '@/components/outline';
import { FlowTabs } from '@/components/flow-tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ExportDialog } from '@/components/export-import/export-dialog';

import { demoNodes } from './flow/data/demo-nodes';
import { demoEdges } from './flow/data/demo-edges';

const initialNodes = demoNodes;
const initialEdges = demoEdges;

const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
};

const edgeTypes = {
  custom: CustomEdge,
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
        updateStepIcon,
        updateEdgeLabel,
        updateEdgeColor,
        updateEdgeIcon,
        deleteSelection,
        groupSelection,
        ungroupSelection,
        handleAutoLayout,
        flows,
        activeFlowId,
        switchFlow,
        addFlow,
        updateFlowTitle,
        deleteFlow,
        duplicateFlow,
        reorderFlow,
        selectedDeliverableId,
        updateDeliverable,
        selectDeliverable,
        metaConfig,
        updateMetaConfig,
        updateMetaData,
        updateDeliverableMetaData,
        hasLoadedFromStorage,
        loadProject,
        saveCurrentFlowState,
        googleDriveFileId,
        setGoogleDriveFileId,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
    } = useVectorFlow(initialNodes, initialEdges);

    const { fitView, getNode, getNodes, setEdges } = useReactFlow();

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [rightSidebarInfo, setRightSidebarInfo] = useState<{
        title: string;
        description: string;
        type: 'step' | 'deliverable' | 'group' | 'edge' | 'multi' | 'none';
        icon?: string;
    }>({
        title: 'Controls',
        description: 'Manage your graph.',
        type: 'none'
    });

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

    const handleSettingsPanelTitleChange = useCallback((title: string, description: string, _deleteText: string, type?: any, icon?: string) => {
        setRightSidebarInfo({ title, description, type: type || 'none', icon });
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
        // Initial auto-layout ONLY once on mount if we haven't recovered from storage
        if (isDesktop !== null && !initialFitDone && getNodes().length > 0) {
            if (!hasLoadedFromStorage) {
                handleAutoLayout({ silent: true });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop, hasLoadedFromStorage]);

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

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
            <Header 
                projectName={projectName} 
                onNameChange={setProjectName}
            >
                <ExportDialog 
                    flows={flows} 
                    activeFlowId={activeFlowId} 
                    projectId={projectId}
                    projectName={projectName}
                    googleDriveFileId={googleDriveFileId}
                    setGoogleDriveFileId={setGoogleDriveFileId}
                    onImport={loadProject} 
                    onSaveState={saveCurrentFlowState}
                />
            </Header>
            
            <Toolbar 
                onLeftSidebarToggle={handleLeftSidebarToggle}
                onRightSidebarToggle={handleRightSidebarToggle}
                onAutoLayout={() => handleAutoLayout({ silent: false })}
                metaConfig={metaConfig}
                onUpdateMetaConfig={updateMetaConfig}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar side="left" open={leftSidebarOpen} onOpenChange={handleLeftSidebarChange} isDesktop={isDesktop}>
                    <Outline 
                        nodes={nodes} 
                        selectedStepId={selectedStepId} 
                        onStepSelect={handleStepSelect}
                        onDeliverableSelect={(nodeId, deliverableId) => {
                            handleStepSelect(nodeId);
                            selectDeliverable(nodeId, deliverableId); // Both arguments needed
                        }} 
                    />
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
                        edgeTypes={edgeTypes}
                        defaultEdgeOptions={{ type: 'custom', zIndex: 10 }}
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
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted shrink-0">
                            {rightSidebarInfo.type === 'step' && <DynamicIcon name={rightSidebarInfo.icon} fallback={Square} className="w-5 h-5" />}
                            {rightSidebarInfo.type === 'deliverable' && <DynamicIcon name={rightSidebarInfo.icon} fallback={FileText} className="w-5 h-5" />}
                            {rightSidebarInfo.type === 'group' && <DynamicIcon name={rightSidebarInfo.icon} fallback={Layers} className="w-5 h-5" />}
                            {rightSidebarInfo.type === 'edge' && <DynamicIcon name={rightSidebarInfo.icon} fallback={Share2} className="w-5 h-5" />}
                            {rightSidebarInfo.type === 'multi' && <Boxes className="w-5 h-5" />}
                            {rightSidebarInfo.type === 'none' && <LayoutGrid className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold leading-none">{rightSidebarInfo.title}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{rightSidebarInfo.description}</p>
                        </div>
                    </div>
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
                            onUpdateStepIcon={updateStepIcon}
                            onUpdateEdgeLabel={updateEdgeLabel}
                            onUpdateEdgeColor={updateEdgeColor}
                            onUpdateEdgeIcon={updateEdgeIcon}
                            onUpdateDeliverable={updateDeliverable}
                            onDeleteSelection={deleteSelection}
                            onGroupSelection={groupSelection}
                            onUngroup={ungroupSelection}
                            onTitleChange={handleSettingsPanelTitleChange}
                            metaConfig={metaConfig}
                            onUpdateMetaData={updateMetaData}
                            onUpdateDeliverableMetaData={updateDeliverableMetaData}
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
                onDeleteFlow={deleteFlow}
                onDuplicateFlow={duplicateFlow}
                onReorderFlow={reorderFlow}
            />
        </div>
    );
}
