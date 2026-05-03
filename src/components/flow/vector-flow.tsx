'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  useReactFlow,
  useNodesInitialized,
  BackgroundVariant,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Plus, Settings2, X, Grip, LayoutGrid, Square, FileText, Layers, Boxes, Share2, Info, Orbit } from 'lucide-react';
import { FlowProvider } from '@/components/flow/flow-context';

import { Sidebar, SidebarHeader, SidebarContent } from '@/components/ui/layout/sidebar';
import { SettingsPanel } from '@/components/panels/settings-panel';
import CustomNode from '@/components/flow/custom-node';
import GroupNode from '@/components/flow/group-node';
import { CustomEdge } from '@/components/flow/custom-edge';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { useVectorFlow } from '@/hooks/use-vector-flow';
import { Header } from '@/components/layout/header';
import { Toolbar } from '@/components/layout/toolbar';
import { Outline } from '@/components/panels/outline';
import { FlowTabs } from '@/components/flow/flow-tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SyncIndicator } from '@/components/sync/sync-indicator';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useAuthActions } from '@/hooks/use-auth-actions';
import { useLocalFileActions } from '@/hooks/use-local-file-actions';
import { useFileNameDialog, FileNameDialog } from '@/hooks/use-file-name-dialog';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFlowTransition } from '@/hooks/flow/use-flow-transition';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import { useProjectActions } from '@/hooks/use-project-actions';


import { ReadOnlyPropertiesPanel } from '@/components/panels/read-only-properties-panel';
import { FlowContextMenu, ContextMenuAction } from '@/components/ui/flow-context-menu';
import { Copy, Trash2, ClipboardPaste, Group, Ungroup, CopyPlus } from 'lucide-react';

import { demoNodes } from './data/demo-nodes';
import { demoEdges } from './data/demo-edges';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export function VectorFlow() {
    const {
        flows,
        activeFlowId,
        switchFlow,
        addFlow,
        updateFlowTitle,
        deleteFlow,
        duplicateFlow,
        reorderFlow,
        updateMetaConfig,
        nodes,
        edges,
        setNodes: setNodesState,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onSelectionChange,
        addStep,
        addDeliverable,
        updateStepLabel,
        updateStepShortDescription,
        updateStepColor,
        updateStepIcon,
        updateEdgeLabel,
        updateEdgeShortDescription,
        updateEdgeColor,
        updateEdgeIcon,
        updateDeliverable,
        deleteSelection,
        groupSelection,
        ungroupSelection,
        handleAutoLayout,
        selectedNodes,
        selectedEdges,
        selectedDeliverableId,
        selectDeliverable,
        metaConfig,
        updateMetaData,
        updateDeliverableMetaData,
        updateEdgeMetaData,
        hasLoadedFromStorage,
        loadProject,
        saveCurrentFlowState,
        cloudProjectId,
        setCloudProjectId,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
        isReadOnly,
        setIsReadOnly,
        undo,
        redo,
        takeSnapshot,
        canUndo,
        canRedo,
        screenToFlowPosition,
        copySelection,
        pasteSelection,
        duplicateSelection,
        splitEdgeWithNode
    } = useVectorFlow(initialNodes, initialEdges);
    // ... existing hooks ...
    const { user } = useUser();
    const { toast } = useToast();

    const { syncState, toggleSync, manualSync } = useCloudSync({
        cloudProjectId,
        projectName,
        flows,
        activeFlowId,
        onImport: loadProject,
    });

    const { handleSignIn } = useAuthActions();
    const { requestFileName, fileNameDialogProps } = useFileNameDialog();
    
    const { handleNewLocal, handleExport, handleImport } = useLocalFileActions({
        projectId,
        projectName,
        flows,
        activeFlowId,
        loadProject,
        setCloudProjectId,
        requestFileName,
    });

    const handleShareLink = useCallback(() => {
        if (!cloudProjectId) return;
        const url = `${window.location.origin}${window.location.pathname}?projectId=${cloudProjectId}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied",
            description: "Anyone with the link can view this flow.",
        });
    }, [cloudProjectId, toast]);

    const handleUnlinkCloud = useCallback(() => {
        setCloudProjectId(undefined);
        toast({
            title: "Unlinked",
            description: "Project disconnected from the cloud.",
        });
    }, [setCloudProjectId, toast]);

    // ── Cloud Project Handlers ─────────────────────────────────────────
    const { handleSaveToCloud, handleNewCloudProject, handleOpenCloudProject, handleDeleteCloudProject } = useProjectActions({
        flows,
        activeFlowId,
        projectId,
        projectName,
        cloudProjectId,
        setCloudProjectId: setCloudProjectId,
        loadProject,
    });

    // View Only Toast Logic
    useEffect(() => {
        if (isReadOnly) {
            toast({
                title: "Read-Only Mode",
                description: "Editing is disabled. You can view items but cannot make changes.",
                duration: 5000,
                className: "bg-amber-50 border-amber-200 text-amber-900",
            });
        }
    }, [isReadOnly, toast]);
    
    const connectingNodeId = useRef<string | null>(null);
    const connectingHandleId = useRef<string | null>(null);

    const { fitView, getNode, getNodes, setEdges, project } = useReactFlow();

    const isTransitioning = useFlowTransition(activeFlowId, fitView);

    const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
        connectingNodeId.current = nodeId;
        connectingHandleId.current = handleId;
    }, []);

    const onConnectEnd = useCallback(
        (event: any) => {
            if (!connectingNodeId.current) return;

            const targetIsPane = event.target.classList.contains('react-flow__pane');

            if (targetIsPane) {
                const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
                const position = screenToFlowPosition({ x: clientX, y: clientY });
                const newNodeId = addStep(position);

                const newEdge = {
                    id: `e${connectingNodeId.current}-${newNodeId}`,
                    source: connectingNodeId.current,
                    target: newNodeId,
                    type: 'custom',
                    animated: true,
                };

                setEdges((eds) => eds.concat(newEdge));
            }
            
            connectingNodeId.current = null;
            connectingHandleId.current = null;
        },
        [project, addStep, setEdges]
    );

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [showFooter, setShowFooter] = useState(false);
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

    const handleStepsSelect = useCallback((nodeIds: string[]) => {
        setNodesState((nds) => nds.map((n) => ({ ...n, selected: nodeIds.includes(n.id) })));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
        
        if (nodeIds.length === 1) {
            fitView({ nodes: [{id: nodeIds[0]}], duration: 300, maxZoom: 1.2 });
        }
    }, [setNodesState, setEdges, fitView]);

    const nodesInitialized = useNodesInitialized();
    const [initialFitDone, setInitialFitDone] = useState(false);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        type: 'node' | 'pane' | 'edge' | 'selection';
        data?: any;
    } | null>(null);

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (isReadOnly) return;
            event.preventDefault();
            
            const isSelected = selectedNodes.some(n => n.id === node.id);
            if (!isSelected) {
                handleStepsSelect([node.id]);
            }
            
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: selectedNodes.length > 1 || (isSelected && selectedNodes.length > 1) ? 'selection' : 'node',
                data: node
            });
        },
        [isReadOnly, selectedNodes, handleStepsSelect]
    );

    const onPaneContextMenu = useCallback(
        (event: React.MouseEvent) => {
            if (isReadOnly) return;
            event.preventDefault();
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: 'pane'
            });
        },
        [isReadOnly]
    );

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            if (isReadOnly) return;
            event.preventDefault();
            
            setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
            setNodesState((nds) => nds.map((n) => ({ ...n, selected: false })));

            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: 'edge',
                data: edge
            });
        },
        [isReadOnly, setEdges, setNodesState]
    );

    const onSelectionContextMenu = useCallback(
        (event: React.MouseEvent, nodes: Node[]) => {
            if (isReadOnly) return;
            event.preventDefault();

            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: 'selection',
                data: nodes 
            });
        },
        [isReadOnly]
    );

    const onPaneClick = useCallback(() => {
        setContextMenu(null);
    }, []);

    useEffect(() => {
        if (isDesktop !== null && !initialFitDone && getNodes().length > 0) {
            if (!hasLoadedFromStorage) {
                handleAutoLayout({ silent: true });
            }
        }
    }, [isDesktop, hasLoadedFromStorage]);

    useEffect(() => {
        if (isDesktop !== null && nodesInitialized && !initialFitDone) {
            const timer = setTimeout(() => {
                fitView({ duration: 600 });
                setInitialFitDone(true);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isDesktop, nodesInitialized, initialFitDone, fitView]);

    const selectedStepId = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0].id : null, [selectedNodes]);

    useKeyboardShortcuts({
        onUndo: undo,
        onRedo: redo,
        onCopy: () => {
            const result = copySelection();
            if (result) {
                toast({
                    title: 'Copied',
                    description: result.type === 'nodes'
                        ? `Copied ${result.count} step(s) to clipboard.`
                        : 'Copied deliverable to clipboard.',
                });
            }
        },
        onPaste: pasteSelection,
        isReadOnly,
    });

    return (
        <FlowProvider value={{ metaConfig }}>
            <div className="flex flex-col h-full w-full bg-background text-foreground font-body">
                <Header 
                    projectName={projectName} 
                    onNameChange={setProjectName}
                    isReadOnly={isReadOnly}
                    syncIndicator={
                        <SyncIndicator
                            user={user}
                            syncState={syncState}
                            cloudProjectId={cloudProjectId}
                            projectId={projectId}
                            projectName={projectName}
                            onToggleSync={toggleSync}
                            onSaveToCloud={handleSaveToCloud}
                            onUnlink={handleUnlinkCloud}
                            onCopyLink={handleShareLink}
                        />
                    }
                />

            <Toolbar 
                onAutoLayout={() => handleAutoLayout({ silent: false })}
                metaConfig={metaConfig}
                onUpdateMetaConfig={updateMetaConfig}
                onExport={handleExport}
                onImport={handleImport}
                isReadOnly={isReadOnly}
                onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
                isReadOnlyForced={false}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}

                onNewLocal={handleNewLocal}
                onNewCloud={handleNewCloudProject}
                onOpenCloud={() => handleOpenCloudProject(projectId)}
                onSaveCloud={manualSync}
                onSaveAsCloud={handleSaveToCloud}
                onToggleAutoSave={toggleSync}
                onSignIn={handleSignIn}
                onShareLink={handleShareLink}
                user={user}
                syncState={syncState}
                cloudProjectId={cloudProjectId}
            />

                <div className="flex flex-1 overflow-hidden">
                    <Sidebar 
                        side="left" 
                        open={leftSidebarOpen} 
                        onOpenChange={handleLeftSidebarChange} 
                        isDesktop={isDesktop}
                        label="Outline"
                        onToggle={handleLeftSidebarToggle}
                    >
                        <Outline 
                            nodes={nodes} 
                            selectedStepIds={selectedNodes.map(n => n.id)} 
                            onStepSelect={handleStepsSelect}
                            onDeliverableSelect={(nodeId, deliverableId) => {
                                handleStepsSelect([nodeId]);
                                selectDeliverable(nodeId, deliverableId);
                            }} 
                            onToggle={handleLeftSidebarToggle}
                        />
                    </Sidebar>

                    <main className="relative flex-1 h-full">
                        {isTransitioning && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                                <Orbit className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onConnectStart={onConnectStart}
                            onConnectEnd={onConnectEnd}
                            onSelectionChange={onSelectionChange}
                            onNodeDragStart={takeSnapshot}
                            onNodeContextMenu={onNodeContextMenu}
                            onPaneContextMenu={onPaneContextMenu}
                            onEdgeContextMenu={onEdgeContextMenu}
                            onEdgeDoubleClick={(event, edge) => {
                                if (isReadOnly) return;
                                splitEdgeWithNode(edge.id, { x: event.clientX, y: event.clientY });
                            }}
                            onSelectionContextMenu={onSelectionContextMenu}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            defaultEdgeOptions={{ type: 'custom', zIndex: 10 }}
                            nodesDraggable={!isReadOnly}
                            nodesConnectable={!isReadOnly}
                            elementsSelectable={true}
                            deleteKeyCode={isReadOnly ? null : 'Delete'}
                            multiSelectionKeyCode="Shift"
                            fitView
                            minZoom={0.1}
                            maxZoom={4}
                            className="bg-background"
                            selectionOnDrag={true}
                            panOnDrag={[1, 2]}
                            selectionMode={SelectionMode.Partial}
                        >
                            <Controls />
                            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                            
                            {contextMenu && (
                                <FlowContextMenu
                                    x={contextMenu.x}
                                    y={contextMenu.y}
                                    onClose={() => setContextMenu(null)}
                                    actions={[
                                        ...((contextMenu.type === 'node' || contextMenu.type === 'selection') ? [
                                            {
                                                label: 'Copy',
                                                icon: Copy,
                                                shortcut: '⌘C',
                                                action: () => {
                                                    copySelection();
                                                    toast({ title: "Copied", description: "Selection copied to clipboard." });
                                                }
                                            },
                                            {
                                                label: 'Duplicate',
                                                icon: CopyPlus,
                                                action: () => {
                                                    duplicateSelection();
                                                    toast({ title: "Duplicated", description: "Selection duplicated." });
                                                }
                                            }
                                        ] : []),

                                        ...((contextMenu.type === 'node' && contextMenu.data?.type === 'group') ? [
                                            {
                                                label: 'Ungroup',
                                                icon: Ungroup,
                                                action: ungroupSelection
                                            }
                                        ] : []),
                                        
                                        ...((contextMenu.type === 'selection') ? [
                                            {
                                                label: 'Group',
                                                icon: Group,
                                                action: groupSelection
                                            }
                                        ] : []),

                                        ...(contextMenu.type === 'pane' ? [
                                            {
                                                label: 'Paste',
                                                icon: ClipboardPaste,
                                                shortcut: '⌘V',
                                                action: () => {
                                                    pasteSelection();
                                                }
                                            }
                                        ] : []),
                                        
                                        ...(contextMenu.type !== 'pane' ? [
                                            {
                                                label: 'Delete',
                                                icon: Trash2,
                                                shortcut: 'Del',
                                                destructive: true,
                                                action: deleteSelection
                                            }
                                        ] : [])
                                    ]}
                                />
                            )}
                        </ReactFlow>
                    </main>
                    
                    {/* Right Sidebar - Settings/Properties */}
                    <Sidebar 
                        side="right" 
                        open={rightSidebarOpen} 
                        onOpenChange={handleRightSidebarChange} 
                        isDesktop={isDesktop}
                        label="Properties"
                        onToggle={handleRightSidebarToggle}
                    >
                        {isReadOnly ? (
                            <ReadOnlyPropertiesPanel 
                                selectedNodes={selectedNodes}
                                selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
                                selectedDeliverableId={selectedDeliverableId}
                                nodes={nodes}
                                metaConfig={metaConfig}
                                onToggle={handleRightSidebarToggle}
                            />
                        ) : (
                            <SettingsPanel 
                                selectedSteps={selectedNodes}
                                selectedEdges={selectedEdges}
                                selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
                                selectedDeliverableId={selectedDeliverableId}
                                onAddStep={addStep}
                                onAddDeliverable={addDeliverable}
                                onUpdateStepLabel={updateStepLabel}
                                onUpdateStepShortDescription={updateStepShortDescription}
                                onUpdateStepColor={updateStepColor}
                                onUpdateStepIcon={updateStepIcon}
                                onUpdateEdgeLabel={updateEdgeLabel}
                                onUpdateEdgeShortDescription={updateEdgeShortDescription}
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
                                onUpdateEdgeMetaData={updateEdgeMetaData}
                                onToggle={handleRightSidebarToggle}
                            />
                        )}
                    </Sidebar>
                </div>
                
                <div className="flex items-center h-10 bg-muted/40 border-t border-border shrink-0 justify-between relative">
                    <FlowTabs
                        flows={flows}
                        activeFlowId={activeFlowId}
                        onSwitchFlow={switchFlow}
                        onAddFlow={addFlow}
                        onUpdateFlowTitle={updateFlowTitle}
                        onDeleteFlow={deleteFlow}
                        onDuplicateFlow={duplicateFlow}
                        onReorderFlow={reorderFlow}
                        isReadOnly={isReadOnly}
                        className="flex-1 min-w-0"
                    />

                    {/* Footer / Info Toggle */}
                    <div className="flex items-center gap-1 shrink-0 h-full border-l border-border/50 px-2 relative bg-muted/40">
                         {/* Mobile Trigger */}
                         <button 
                            className="md:hidden p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                            onClick={() => setShowFooter(!showFooter)}
                            title="Legal & Info"
                         >
                            <Info size={14} />
                         </button>

                         {/* Content */}
                         <div className={cn(
                            "items-center text-[10px] text-muted-foreground/60 transition-all whitespace-nowrap z-50",
                            // Mobile styling: Popover
                            "absolute bottom-full right-2 mb-2 p-3 bg-popover/95 backdrop-blur border border-border shadow-lg rounded-md flex-col items-start gap-2 min-w-[140px]",
                            // Desktop styling: Inline
                            "md:static md:bg-transparent md:border-none md:p-0 md:shadow-none md:flex-row md:items-center md:gap-4 md:mb-0",
                            // Toggle visibility on mobile
                            !showFooter ? "hidden md:flex" : "flex"
                         )}>
                            <span>&copy; {new Date().getFullYear()} VectorFlow</span>
                            <Link href="/privacy-policy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
                            <Link href="/terms-of-service" className="hover:text-muted-foreground transition-colors">Terms</Link>
                         </div>
                    </div>
                </div>
                
                <FileNameDialog {...fileNameDialogProps} />
            </div>
        </FlowProvider>
    );
}
