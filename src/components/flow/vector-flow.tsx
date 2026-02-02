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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Settings2, X, Grip, LayoutGrid, Square, FileText, Layers, Boxes, Share2 } from 'lucide-react';

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
import { useDriveSync } from '@/hooks/use-drive-sync';
import { useGoogleDriveToken } from '@/hooks/use-google-drive';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useDrivePicker } from '@/lib/google-drive/picker';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { ExportImportService } from '@/lib/export-import';
import { ReadOnlyPropertiesPanel } from '@/components/panels/read-only-properties-panel';

import { demoNodes } from './data/demo-nodes';
import { demoEdges } from './data/demo-edges';

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
        updateStepColor,
        updateStepIcon,
        updateEdgeLabel,
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
        hasLoadedFromStorage,
        loadProject,
        saveCurrentFlowState,
        googleDriveFileId,
        setGoogleDriveFileId,
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
        screenToFlowPosition
    } = useVectorFlow(initialNodes, initialEdges);

    const { user } = useUser();
    const { toast } = useToast();
    const accessToken = useGoogleDriveToken();
    const { openPicker } = useDrivePicker(accessToken);

    const { syncState, toggleSync } = useDriveSync({
        fileId: googleDriveFileId,
        projectId,
        projectName,
        flows,
        activeFlowId,
        onImport: loadProject,
        onPermissionsChange: (shouldBeReadOnly) => {
            // Only force read-only if permissions require it
            if (shouldBeReadOnly) {
                setIsReadOnly(true);
            }
            // Don't automatically disable read-only when permissions allow editing
            // Let the user control it manually
        },
    });

    // View Only Toast Logic
    useEffect(() => {
        if (isReadOnly) {
            toast({
                title: syncState.isReadOnlyDueToPermissions ? "View-Only Mode" : "Read-Only Mode",
                description: syncState.isReadOnlyDueToPermissions 
                    ? "You don't have edit permission for this Drive file." 
                    : "Editing is disabled. You can view items but cannot make changes.",
                duration: 5000, // Show for 5 seconds (not persistent to avoid blocking too)
                // We could make it persistent with duration: Infinity if desired, but user asked for less blocking.
                className: "bg-amber-50 border-amber-200 text-amber-900",
            });
        }
    }, [isReadOnly, syncState.isReadOnlyDueToPermissions, toast]);
    
    // Connection handling state
    const connectingNodeId = useRef<string | null>(null);
    const connectingHandleId = useRef<string | null>(null);

    const { fitView, getNode, getNodes, setEdges, project } = useReactFlow();

    // URL Hydration Logic
    const hasAttemptedHydration = useRef(false);

    // Handle initial fit view after hydration
    useEffect(() => {
        if (hasAttemptedHydration.current && nodes.length > 0) {
           const timer = setTimeout(() => {
               fitView({ duration: 800 });
           }, 300); // Small delay to allow react-flow to render nodes
           return () => clearTimeout(timer);
        }
    }, [hasAttemptedHydration.current, nodes.length, fitView]);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const driveIdParam = params.get('driveId');

        // If no driveId, we're done
        if (!driveIdParam) return;

        // If we already tried, stop (prevent infinite loops)
        if (hasAttemptedHydration.current) return;

        // Common success handler
        const handleSuccess = (data: any) => {
             loadProject(data.flows, data.activeFlowId, data.projectId, data.projectName, driveIdParam);
             
             // Clear the URL parameter
             const newUrl = window.location.pathname;
             window.history.replaceState({}, '', newUrl);

             // Fit view will be handled by the effect above interacting with nodes change
        };

        // If we have a user and access token, we can try to load
        if (user && accessToken && !googleDriveFileId && !hasLoadedFromStorage) {
            hasAttemptedHydration.current = true;
            
            const loadDriveFile = async () => {
                try {
                    toast({
                        title: "Loading Project...",
                        description: "Fetching project from Google Drive link.",
                    });

                    const data = await GoogleDriveService.getFileContent(driveIdParam);
                    handleSuccess(data);
                    
                    toast({
                        title: "Project Loaded",
                        description: `Successfully loaded "${data.projectName || 'project'}" from shared link.`,
                    });

                } catch (error: any) {
                    console.error('Failed to hydrate from driveId:', error);
                    toast({
                        variant: "destructive",
                        title: "Load Failed",
                        description: error.message || "Failed to load shared project. You may need to request access.",
                    });
                }
            };

            loadDriveFile();
        } else if (!user && !googleDriveFileId && !hasLoadedFromStorage) {
            // Not logged in - try public download first
             if (!hasAttemptedHydration.current) {
                 hasAttemptedHydration.current = true;
                 
                 const loadPublicFile = async () => {
                     try {
                         toast({
                             title: "Loading Shared Project...",
                             description: "Attempting to load public project...",
                         });

                         const data = await GoogleDriveService.downloadPublicFile(driveIdParam);
                         handleSuccess(data);
                         
                         // Force read-only for public views
                         setIsReadOnly(true);
                         
                         toast({
                             title: "View-Only Mode",
                             description: `Loaded "${data.projectName || 'project'}". Sign in to edit.`,
                         });
                    } catch (error: any) {
                        console.warn('Public download failed, prompting login:', error);
                        // If public download fails, just notify them to sign in
                        toast({
                            title: "Sign In Required",
                            description: "Please sign in to access this private project.",
                        });
                    }
                 }
                 
                 loadPublicFile();
             }
        }
    }, [user, accessToken, googleDriveFileId, hasLoadedFromStorage, loadProject, toast, setIsReadOnly]);

    const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
        connectingNodeId.current = nodeId;
        connectingHandleId.current = handleId;
    }, []);

    const onConnectEnd = useCallback(
        (event: any) => {
            if (!connectingNodeId.current) return;

            const targetIsPane = event.target.classList.contains('react-flow__pane');
            console.log('onConnectEnd EVENT', {
                target: event.target,
                classes: Array.from(event.target.classList),
                targetIsPane,
                connectingNodeId: connectingNodeId.current
            });

            if (targetIsPane) {
                // Remove the wrapper bounds calculation if not needed or perform exact calculations
                // Assuming event is a mouse/touch event on the window/element
                const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
                
                // screenToFlowPosition handles bounds and zoom automatically
                const position = screenToFlowPosition({ x: clientX, y: clientY });

                // Create new step at this position
                const newNodeId = addStep(position);

                // Add connection
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
            setNodesState((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
            setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
            fitView({ nodes: [{id: nodeId}], duration: 300, maxZoom: 1.2 });
        }
    }, [getNode, setNodesState, setEdges, fitView]);

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

    const handleBrowseDrive = async () => {
        if (!user || !accessToken) {
            toast({
                title: "Login Required",
                description: "Please sign in with Google to browse Drive.",
            });
            return;
        }

        try {
            await openPicker(
                async (file) => {
                    const data = await GoogleDriveService.getFileContent(file.id);
                    loadProject(data.flows, data.activeFlowId, data.projectId, data.projectName, file.id);
                    toast({
                        title: "Project Loaded",
                        description: `Successfully imported "${file.name}" from Google Drive.`,
                    });
                },
                () => console.log('Picker cancelled')
            );
        } catch (error: any) {
            console.error('Picker error:', error);
            toast({
                variant: "destructive",
                title: "Drive Error",
                description: "Failed to open Drive picker.",
            });
        }
    };

    const handleCreateDriveFile = async () => {
        if (!user || !accessToken) {
            toast({
                title: "Login Required",
                description: "Please sign in with Google to create a file.",
            });
            return;
        }

        try {
            await openPicker(
                async (folder) => {
                    const data = {
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                        projectId,
                        projectName,
                        flows,
                        activeFlowId,
                    };

                    try {
                        const fileId = await GoogleDriveService.createFile(
                            `${projectName || 'vectorflow-project'}.json`,
                            data,
                            folder.id
                        );
                        
                        setGoogleDriveFileId(fileId);
                        
                        toast({
                            title: "File Created",
                            description: `Successfully created project file in Google Drive.`,
                        });
                    } catch (err: any) {
                         console.error('File creation error:', err);
                         toast({
                            variant: "destructive",
                            title: "Creation Failed",
                            description: err.message || "Failed to create file.",
                        });
                    }
                },
                () => console.log('Picker cancelled'),
                'folder'
            );
        } catch (error: any) {
            console.error('Picker error:', error);
            toast({
                variant: "destructive",
                title: "Drive Error",
                description: "Failed to open Drive picker.",
            });
        }
    };

    const handleUnlinkDrive = () => {
        setGoogleDriveFileId(undefined);
        toast({
            title: "Unlinked",
            description: "Project disconnected from Google Drive.",
        });
    };

    const handleExport = async () => {
        try {
            const data = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                projectId,
                projectName,
                flows,
                activeFlowId,
            };

            const exportResult = await ExportImportService.export('json', data);
            const blob = new Blob([exportResult.content], { type: exportResult.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = (projectName || 'project').replace(/[^a-z0-9]/gi, '-').toLowerCase();
            a.download = `vectorflow-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Project Exported",
                description: "Downloaded to your computer.",
            });
        } catch (error: any) {
            console.error('Export failed:', error);
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: error.message || "Failed to export project.",
            });
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const extension = file.name.split('.').pop() || 'json';
                const data = await ExportImportService.import(extension, file);
                
                loadProject(data.flows, data.activeFlowId, data.projectId, data.projectName);

                toast({
                    title: "Project Imported",
                    description: `Loaded ${data.flows.length} flow(s) from file.`,
                });
            } catch (error: any) {
                console.error('Import failed:', error);
                toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: error.message || "Failed to import project.",
                });
            }
        };
        input.click();
    };

    // Keyboard Shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isReadOnly) return;
            
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, isReadOnly]);

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground font-body">
            <Header 
                projectName={projectName} 
                onNameChange={setProjectName}
                isReadOnly={isReadOnly}
                syncIndicator={
                    <SyncIndicator
                        user={user}
                        syncState={syncState}
                        googleDriveFileId={googleDriveFileId}
                        projectId={projectId}
                        projectName={projectName}
                        onToggleSync={toggleSync}
                        onBrowseDrive={handleBrowseDrive}
                        onCreateFile={handleCreateDriveFile}
                        onUnlink={handleUnlinkDrive}
                        onCopyLink={() => {
                            toast({
                                title: "Link Copied",
                                description: "Shareable link copied to clipboard.",
                            });
                        }}
                    />
                }
            />
            
            <Toolbar 
                onLeftSidebarToggle={handleLeftSidebarToggle}
                onRightSidebarToggle={handleRightSidebarToggle}
                onAutoLayout={() => handleAutoLayout({ silent: false })}
                metaConfig={metaConfig}
                onUpdateMetaConfig={updateMetaConfig}
                leftSidebarOpen={leftSidebarOpen}
                rightSidebarOpen={rightSidebarOpen}
                onExport={handleExport}
                onImport={handleImport}
                isReadOnly={isReadOnly}
                onToggleReadOnly={() => {
                    if (!syncState.isReadOnlyDueToPermissions) {
                        setIsReadOnly(!isReadOnly);
                    }
                }}
                isReadOnlyForced={syncState.isReadOnlyDueToPermissions}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Outline */}
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
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        onSelectionChange={onSelectionChange}
                        onNodeDragStart={takeSnapshot}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        defaultEdgeOptions={{ type: 'custom', zIndex: 10 }}
                        nodesDraggable={!isReadOnly}
                        nodesConnectable={!isReadOnly}
                        elementsSelectable={true}
                        deleteKeyCode={isReadOnly ? null : 'Delete'}
                        fitView
                        minZoom={0.1}
                        maxZoom={4}
                        className="bg-background"
                    >
                        <Controls />
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                    </ReactFlow>
                </main>
                
                {/* Right Sidebar - Settings/Properties */}
                <Sidebar side="right" open={rightSidebarOpen} onOpenChange={handleRightSidebarChange} isDesktop={isDesktop}>
                    {isReadOnly ? (
                        <ReadOnlyPropertiesPanel
                            selectedNodes={selectedNodes}
                            selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
                            selectedDeliverableId={selectedDeliverableId}
                            nodes={nodes}
                            metaConfig={metaConfig}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
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
                isReadOnly={isReadOnly}
            />
            

        </div>
    );
}
