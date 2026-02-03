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
import { Plus, Settings2, X, Grip, LayoutGrid, Square, FileText, Layers, Boxes, Share2, Info } from 'lucide-react';
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
import { useDriveSync } from '@/hooks/use-drive-sync';
import { useGoogleDriveToken } from '@/hooks/use-google-drive';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useAuthActions } from '@/hooks/use-auth-actions';
import { useDriveFileActions } from '@/hooks/use-drive-file-actions';
import { useLocalFileActions } from '@/hooks/use-local-file-actions';
import { useFileNameDialog, FileNameDialog } from '@/hooks/use-file-name-dialog';
import { DriveBrowserDialog } from '@/components/drive/drive-browser-dialog';

import { ReadOnlyPropertiesPanel } from '@/components/panels/read-only-properties-panel';
import { FlowContextMenu, ContextMenuAction } from '@/components/ui/flow-context-menu';
import { Copy, Trash2, ClipboardPaste, Group, Ungroup, CopyPlus } from 'lucide-react';

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
        updateEdgeMetaData,
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
        screenToFlowPosition,
        copySelection,
        pasteSelection,
        duplicateSelection
    } = useVectorFlow(initialNodes, initialEdges);
    // ... existing hooks ...
    const { user } = useUser();
    const { toast } = useToast();
    const accessToken = useGoogleDriveToken();


    const { syncState, toggleSync, manualSync } = useDriveSync({
        fileId: googleDriveFileId,
        projectId,
        projectName,
        flows,
        activeFlowId,
        onImport: loadProject,
        onPermissionsChange: (shouldBeReadOnly) => {
            if (shouldBeReadOnly) {
                setIsReadOnly(true);
            }
        },
    });

    // ... existing code ...

    // Consolidated Actions
    const { handleSignIn } = useAuthActions();
    const { requestFileName, fileNameDialogProps } = useFileNameDialog();
    
    const { handleNewLocal, handleExport, handleImport } = useLocalFileActions({
        projectId,
        projectName,
        flows,
        activeFlowId,
        loadProject,
        setGoogleDriveFileId,
        requestFileName,
    });

    const handleShareLink = useCallback(() => {
        if (!googleDriveFileId) return;
        const url = `${window.location.origin}${window.location.pathname}?driveId=${googleDriveFileId}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied",
            description: "Share link copied. End user must have appropriate permissions to access.",
        });
    }, [googleDriveFileId, toast]);

    const handleUnlinkDrive = useCallback(() => {
        setGoogleDriveFileId(undefined);
        toast({
            title: "Unlinked",
            description: "Project disconnected from Google Drive.",
        });
    }, [setGoogleDriveFileId, toast]);

    const { handleBrowseDrive, handleCreateDriveFile, driveBrowserProps } = useDriveFileActions({
        user,
        accessToken,
        projectId,
        projectName,
        flows,
        activeFlowId,
        loadProject,
        setGoogleDriveFileId,
        requestFileName,
    });
    
    // ... handleBrowseDrive, handleCreateDriveFile ...

    // ... existing code ...

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

    const handleStepsSelect = useCallback((nodeIds: string[]) => {
        setNodesState((nds) => nds.map((n) => ({ ...n, selected: nodeIds.includes(n.id) })));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
        
        // Optional: Fit view to selected nodes if only one or specific count? 
        // Let's keep fit view behavior only for single select to avoid jumping around on multiselect
        if (nodeIds.length === 1) {
            fitView({ nodes: [{id: nodeIds[0]}], duration: 300, maxZoom: 1.2 });
        }
    }, [setNodesState, setEdges, fitView]);

    const nodesInitialized = useNodesInitialized();
    const [initialFitDone, setInitialFitDone] = useState(false);

    // Context Menu State
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
            
            // If the node is not currently selected, select it (exclusive)
            // Unless it's already part of a multi-selection
            const isSelected = selectedNodes.some(n => n.id === node.id);
            if (!isSelected) {
                // We cannot use handleStepSelect here because it was defined inside the component 
                // but we need access to it. It IS defined above though, at line ~349.
                // Ah, the lint error was because I pasted the definition BEFORE handleStepSelect was defined.
                // Now I am pasting it at the end (before return), so it should be fine.
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
            
            // useReactFlow provides setEdges but we also have setEdgesState from our hook?
            // Actually useVectorFlow exposes setEdges as well? No, it exposes updateEdge...
            // Let's use the reactflow instance setEdges which we got at line 151
            setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
            
            // And we need to deselect nodes. 
            // We have setNodesState exposed from useVectorFlow at line 66
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
                data: nodes // Pass selected nodes if needed, though we rely on selectedNodes state usually
            });
        },
        [isReadOnly]
    );

    const onPaneClick = useCallback(() => {
        setContextMenu(null);
    }, []);

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

    // Handlers managed by hooks (useDriveFileActions, useLocalFileActions)

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

    // Copy/Paste Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isReadOnly) return;
            // Ignore if input/textarea is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault();
                const result = copySelection();
                if (result) {
                    toast({
                        title: "Copied",
                        description: result.type === 'nodes' 
                            ? `Copied ${result.count} step(s) to clipboard.` 
                            : "Copied deliverable to clipboard.",
                    });
                }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault();
                // Paste happens via callback in hook, which updates state
                // We don't get immediate feedback here unless we wrap it or trust the hook
                // The hook currently logs warn on error.
                // We can't catch the error from the hook's internal callback easily here without changing the hook signature
                // to return a promise or take a toast callback.
                // For now, let's just trigger it.
                pasteSelection(); 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [copySelection, pasteSelection, isReadOnly, toast]);

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

                    onNewLocal={handleNewLocal}
                    
                    user={user}
                    syncState={syncState}
                    googleDriveFileId={googleDriveFileId}
                    onNewCloud={handleCreateDriveFile}
                    onOpenCloud={handleBrowseDrive}
                    onSaveCloud={manualSync}
                    onSaveAsCloud={handleCreateDriveFile}
                    onToggleAutoSave={toggleSync}
                    onSignIn={handleSignIn}
                    onShareLink={handleShareLink}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Outline */}
                    <Sidebar side="left" open={leftSidebarOpen} onOpenChange={handleLeftSidebarChange} isDesktop={isDesktop}>
                        <Outline 
                            nodes={nodes} 
                            selectedStepIds={selectedNodes.map(n => n.id)} 
                            onStepSelect={handleStepsSelect}
                            onDeliverableSelect={(nodeId, deliverableId) => {
                                handleStepsSelect([nodeId]);
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
                            onNodeContextMenu={onNodeContextMenu}
                            onPaneContextMenu={onPaneContextMenu}
                            onEdgeContextMenu={onEdgeContextMenu}
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
                            panOnDrag={[1, 2]} // Middle and Right click to pan
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
                                        // Node Actions
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

                                        // Group Actions (Single Group or Multi-Select)
                                        ...((contextMenu.type === 'node' && contextMenu.data?.type === 'group') ? [
                                            {
                                                label: 'Ungroup',
                                                icon: Ungroup,
                                                action: ungroupSelection
                                            }
                                        ] : []),
                                        
                                        // Grouping via Multi-Select
                                        ...((contextMenu.type === 'selection') ? [
                                            {
                                                label: 'Group',
                                                icon: Group,
                                                action: groupSelection
                                            }
                                        ] : []),

                                        // Pane Actions
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
                                        
                                        // Delete Action (Common for all except pane)
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
                                        selectedEdges={selectedEdges}
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
                                        onUpdateEdgeMetaData={updateEdgeMetaData} 
                                    />
                                </SidebarContent>
                            </>
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
                <DriveBrowserDialog {...driveBrowserProps} />
            </div>
        </FlowProvider>
    );
}
