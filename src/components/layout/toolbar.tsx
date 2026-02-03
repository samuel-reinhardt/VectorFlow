'use client';

import { PanelLeft, LayoutGrid, Workflow, Settings2, Download, Upload, Eye, RotateCcw, RotateCw, File, Cloud, Plus, Save, FileJson, LogIn, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { MetaConfigEditor } from '@/components/editors/meta-config-editor';
import type { MetaConfig, FieldDefinition } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/overlay/dropdown-menu';
import { SyncState } from '@/hooks/use-drive-sync';

interface ToolbarProps {
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  onAutoLayout: () => void;
  metaConfig: MetaConfig;
  onUpdateMetaConfig: (type: keyof MetaConfig, value: any) => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onExport?: () => void;
  onImport?: () => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  isReadOnlyForced?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  // New Props for File Menus
  onNewLocal?: () => void;
  
  // Cloud Props
  user?: any;
  syncState?: SyncState;
  googleDriveFileId?: string;
  onNewCloud?: () => void;
  onOpenCloud?: () => void;
  onSaveCloud?: () => void;
  onSaveAsCloud?: () => void;
  onToggleAutoSave?: () => void;
  onSignIn?: () => void;
  onShareLink?: () => void;
}

export function Toolbar({
  onLeftSidebarToggle,
  onRightSidebarToggle,
  onAutoLayout,
  metaConfig,
  onUpdateMetaConfig,
  leftSidebarOpen,
  rightSidebarOpen,
  onExport,
  onImport,
  isReadOnly,
  onToggleReadOnly,
  isReadOnlyForced = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onNewLocal,
  user,
  syncState,
  googleDriveFileId,
  onNewCloud,
  onOpenCloud,
  onSaveCloud,
  onSaveAsCloud,
  onToggleAutoSave,
  onSignIn,
  onShareLink,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
      {/* Left Section - Sidebar Toggles */}
      <div className="flex items-center gap-2">
        <Button
          variant={leftSidebarOpen ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3 gap-2"
          onClick={onLeftSidebarToggle}
          aria-label="Toggle outline panel"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="text-xs font-medium">Outline</span>
        </Button>
        
        <Button
          variant={rightSidebarOpen ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3 gap-2"
          onClick={onRightSidebarToggle}
          aria-label="Toggle properties panel"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="text-xs font-medium">Properties</span>
        </Button>
      </div>
      
      {/* Center Section - Actions */}
      <div className="flex items-center gap-2">

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
                aria-label="Redo"
                title="Redo (Ctrl+Y)"
            >
                <RotateCw className="h-4 w-4" />
            </Button>
        </div>

        {/* Local File Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 gap-2">
              <File className="h-4 w-4" />
              <span className="text-xs font-medium">Local File</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onNewLocal}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport} disabled={!onImport}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Import</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} disabled={!onExport}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cloud File Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 gap-2">
              <Cloud className="h-4 w-4" />
              <span className="text-xs font-medium">Cloud File</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {!user ? (
              <div className="p-2 space-y-2">
                <div className="text-xs font-semibold">Google Drive Auto-Save</div>
                <div className="text-[10px] text-muted-foreground">
                  Sign in to save your work to the cloud, access it from anywhere, and never lose progress.
                </div>
                <Button size="sm" className="w-full gap-2 text-xs" onClick={onSignIn}>
                  <LogIn className="h-3 w-3" />
                  Sign In with Google
                </Button>
              </div>
            ) : (
              <>
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onNewCloud}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenCloud}>
                  <FileJson className="mr-2 h-4 w-4" />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onSaveCloud} 
                  disabled={!googleDriveFileId}
                >
                  <Save className="mr-2 h-4 w-4" />
                  <span>Save</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onSaveAsCloud} 
                  disabled={!googleDriveFileId}
                >
                  <Save className="mr-2 h-4 w-4" />
                  <span>Save As...</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onShareLink} 
                  disabled={!googleDriveFileId}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share Link</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {syncState && (
                  <DropdownMenuCheckboxItem
                    checked={syncState.isSyncEnabled}
                    onCheckedChange={onToggleAutoSave}
                    disabled={!googleDriveFileId}
                  >
                    <span className="mr-2">Auto Save</span>
                  </DropdownMenuCheckboxItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isReadOnly && (
          <>
            <div className="h-4 w-px bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm" 
              onClick={onAutoLayout}
              className="h-8 px-3 gap-2"
              aria-label="Auto-arrange nodes"
            >
              <Workflow className="h-4 w-4" />
              <span className="text-xs font-medium">Auto-Arrange</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <MetaConfigEditor 
              config={metaConfig} 
              onUpdate={onUpdateMetaConfig} 
            />
          </>
        )}
      </div>
      
      {/* Right Section - View Only Toggle */}
      <div className="flex items-center">
        <Button
          variant={isReadOnly ? "default" : "ghost"}
          size="sm"
          onClick={onToggleReadOnly}
          disabled={isReadOnlyForced}
          className="h-8 px-3 gap-2"
          title={isReadOnlyForced ? "Read-only mode enforced by file permissions" : "Toggle read-only mode"}
          aria-label="Toggle read-only mode"
        >
          <Eye className="h-4 w-4" />
          <span className="text-xs font-medium">View Only</span>
        </Button>
      </div>
    </div>
  );
}
