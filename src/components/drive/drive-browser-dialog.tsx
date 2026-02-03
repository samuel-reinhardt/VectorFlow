
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { GoogleDriveService, DriveFile } from '@/lib/google-drive/service';
import { Input } from '@/components/ui/forms/input';
import { Loader2, Folder, FileJson, ChevronRight, Home, ArrowLeft, Plus, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileNameDialog, FileNameDialog } from '@/hooks/use-file-name-dialog';

interface DriveBrowserOptions {
  mode: 'file' | 'folder';
  onSelect: (file: DriveFile) => void;
  onCancel?: () => void;
  title?: string;
  confirmLabel?: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function useDriveBrowser() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DriveBrowserOptions | null>(null);

  const openBrowser = useCallback((options: DriveBrowserOptions) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const closeBrowser = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
        config?.onCancel?.();
        setConfig(null);
    }, 100);
  }, [config]);

  const handleSelect = useCallback((file: DriveFile) => {
    setIsOpen(false);
    setTimeout(() => {
        config?.onSelect(file);
        setConfig(null);
    }, 100);
  }, [config]);

  // Holistic fix: Safety cleanup to ensure pointer-events are restored
  // This handles cases where Radix UI might leave the body locked due to race conditions
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!isOpen) {
      // Small delay to allow Radix to finish its own cleanup
      timeoutId = setTimeout(() => {
        // If body is still locked after close, force unlock
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return {
    openBrowser,
    driveBrowserProps: {
      isOpen,
      onClose: closeBrowser,
      onSelect: handleSelect,
      mode: config?.mode || 'file',
      title: config?.title,
      confirmLabel: config?.confirmLabel
    }
  };
}

interface DriveBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: DriveFile) => void;
  mode: 'file' | 'folder';
  title?: string;
  confirmLabel?: string;
}

export function DriveBrowserDialog({
  isOpen,
  onClose,
  onSelect,
  mode,
  title,
  confirmLabel
}: DriveBrowserProps) {
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem>({ id: 'root', name: 'My Drive' });
  const [history, setHistory] = useState<BreadcrumbItem[]>([]);
  const [items, setItems] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DriveFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reuse filename dialog for creating folders
  const { requestFileName, fileNameDialogProps } = useFileNameDialog();

  const allowedMimeTypes = React.useMemo(() => {
    if (mode === 'folder') return ['application/vnd.google-apps.folder'];
    return ['application/vnd.google-apps.folder', 'application/json'];
  }, [mode]);

  const loadContents = useCallback(async (folderId: string, query?: string) => {
    setLoading(true);
    setSelectedItem(null);
    try {
      let files;
      if (query && query.trim()) {
           files = await GoogleDriveService.searchFiles(query.trim(), allowedMimeTypes);
      } else {
           files = await GoogleDriveService.listContents(folderId, allowedMimeTypes);
      }
      setItems(files);
    } catch (error) {
      console.error("Failed to load contents:", error);
    } finally {
      setLoading(false);
    }
  }, [allowedMimeTypes]);

  // Debounced search / content load
  useEffect(() => {
      const timer = setTimeout(() => {
          if (isOpen) {
             loadContents(currentFolder.id, searchQuery);
          }
      }, 300);
      return () => clearTimeout(timer);
  }, [searchQuery, currentFolder.id, isOpen, loadContents]);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setCurrentFolder({ id: 'root', name: 'My Drive' });
      setHistory([]);
      setSearchQuery('');
      setItems([]);
    }
  }, [isOpen]);

  const handleNavigate = (folder: DriveFile) => {
    if (folder.mimeType === 'application/vnd.google-apps.folder') {
      setHistory(prev => [...prev, currentFolder]);
      setCurrentFolder({ id: folder.id, name: folder.name });
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentFolder(previous);
    setSearchQuery('');
  };
  
  const handleCreateFolder = async () => {
      const name = await requestFileName("New Folder", "Untitled Folder", "Enter a name for the new folder.", "Create");
      if (!name) return;
      
      try {
          setLoading(true);
          await GoogleDriveService.createFolder(name, currentFolder.id);
          // Reload
          await loadContents(currentFolder.id);
      } catch (err) {
          console.error(err);
          alert("Failed to create folder");
      } finally {
          setLoading(false);
      }
  };

  const handleConfirmSelect = () => {
      if (mode === 'folder') {
          // If a folder is selected in the list, return that.
          // If nothing selected, return CURRENT folder.
          if (selectedItem && selectedItem.mimeType === 'application/vnd.google-apps.folder') {
              onSelect(selectedItem);
          } else {
              // Return current folder as the selection
              onSelect({
                  id: currentFolder.id,
                  name: currentFolder.name,
                  mimeType: 'application/vnd.google-apps.folder',
                  modifiedTime: new Date().toISOString()
              });
          }
      } else {
          // File mode
          if (selectedItem) {
              onSelect(selectedItem);
          }
      }
  };
  
  // Compute breadcrumbs for display
  // We can show "My Drive > Folder > Subfolder"
  // history + current
  
  // Format date
  const formatDate = (iso: string) => {
      return new Date(iso).toLocaleDateString();
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between gap-4 mb-2">
             <DialogTitle className="shrink-0">{title || (mode === 'folder' ? 'Select Folder' : 'Select File')}</DialogTitle>
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Search..." 
                   value={searchQuery} 
                   onChange={e => setSearchQuery(e.target.value)}
                   className="pl-8 h-8"
                />
             </div>
             <Button size="sm" variant="ghost" className="h-8 gap-1 shrink-0" onClick={handleCreateFolder} disabled={!!searchQuery}>
                 <Plus className="w-4 h-4" /> New Folder
             </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 overflow-hidden whitespace-nowrap">
             {/* Breadcrumbs */}
             <button onClick={() => {
                 if (history.length === 0) return;
                 setCurrentFolder({ id: 'root', name: 'My Drive' });
                 setHistory([]);
                 loadContents('root');
             }} className="hover:text-foreground flex items-center">
                 <Home className="w-4 h-4 mr-1" />
             </button>
             
             {history.length > 0 && <span className="opacity-50">/</span>}
             
             {/* Show only last 2 items if deep? */}
             {history.map((item, i) => (
                 <React.Fragment key={item.id}>
                     <button className="hover:text-foreground truncate max-w-[100px]" onClick={() => {
                         // Go back to this item
                         const idx = history.findIndex(h => h.id === item.id);
                         const newHistory = history.slice(0, idx);
                         setHistory(newHistory);
                         setCurrentFolder(item);
                         loadContents(item.id);
                     }}>
                        {item.name}
                     </button>
                     <span className="opacity-50">/</span>
                 </React.Fragment>
             ))}
             
             <span className="font-medium text-foreground truncate">{currentFolder.name}</span>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    Loading...
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Folder className="w-12 h-12 mb-2 opacity-20" />
                    <p>Empty folder</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-1">
                    {/* Back Button within list if not root? */}
                    {currentFolder.id !== 'root' && (
                        <div 
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer text-muted-foreground"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>...</span>
                        </div>
                    )}
                    
                    {items.map((item) => {
                        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                        // In file mode, dim folders if they aren't selectable? No, we need them to navigate.
                        // But we can selectable them?
                        
                        const isSelected = selectedItem?.id === item.id;
                        
                        // Disable file selection in folder mode, and folder selection in file mode?
                        // No, in folder mode, clicking folder navigates. Selecting it requires clicking check? 
                        // UX: Single click select, Double click navigate?
                        // Or Click -> Select. If folder, show "Open" button?
                        // Let's go with: Click selects. Double Click opens (navigates).
                        
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer border border-transparent",
                                    isSelected ? "bg-accent/50 border-accent text-accent-foreground" : "hover:bg-muted"
                                )}
                                onClick={() => setSelectedItem(item)}
                                onDoubleClick={() => {
                                    if (isFolder) handleNavigate(item);
                                }}
                            >
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                     {isFolder ? <Folder className="w-5 h-5 text-blue-400 fill-blue-400/20" /> : <FileJson className="w-5 h-5 text-orange-400" />}
                                     <span className="truncate">{item.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground w-24 text-right">
                                    {formatDate(item.modifiedTime)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        <DialogFooter className="p-4 border-t flex justify-between items-center bg-muted/20">
            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                {selectedItem ? selectedItem.name : (mode === 'folder' ? `Current: ${currentFolder.name}` : 'No selection')}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={() => {
                        if (selectedItem?.mimeType === 'application/vnd.google-apps.folder') {
                           // If folder selected, maybe user wants to navigate into it?
                           // Or select it?
                           // In 'folder' mode, 'Select' means choose this folder.
                           // In 'file' mode, folder selection is invalid for 'Open', but maybe valid for browsing?
                           // Let's assume Confirm executes the action.
                           if (mode === 'file') {
                               handleNavigate(selectedItem);
                               return;
                           }
                        }
                        handleConfirmSelect();
                    }}
                    disabled={mode === 'file' && !selectedItem}
                >
                    {mode === 'folder' 
                        ? (selectedItem?.mimeType === 'application/vnd.google-apps.folder' ? 'Select Folder' : 'Select This Location') 
                        : (selectedItem?.mimeType === 'application/vnd.google-apps.folder' ? 'Open' : 'Open')
                    }
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <FileNameDialog {...fileNameDialogProps} />
    </>
  );
}
