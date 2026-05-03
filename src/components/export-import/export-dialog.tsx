'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/forms/select';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { 
  Download, 
  Upload, 
  FileJson, 
  Share2, 
  AlertCircle, 
  Cloud, 
  RefreshCw, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { ExportImportService, ExportData } from '@/lib/export-import';
import { Flow } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import { useProjectActions } from '@/hooks/use-project-actions';


interface ExportDialogProps {
  flows: Flow[];
  activeFlowId: string;
  projectId: string;
  projectName: string;
  cloudProjectId?: string;
  setCloudProjectId: (id: string) => void;
  onImport: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string, driveId?: string) => void;
  onSaveState?: () => void;
  syncState: any; // We'll type this as SyncState from cloud-sync later if needed, but any is fine for now
  toggleSync: () => void;
  handleSaveToCloud: () => Promise<void>;
  handleOpenCloudProject: () => void;
}

export function ExportDialog({ 
  flows, 
  activeFlowId, 
  projectId,
  projectName,
  cloudProjectId, 
  setCloudProjectId,
  onImport, 
  onSaveState,
  syncState,
  toggleSync,
  handleSaveToCloud,
  handleOpenCloudProject,
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  
  const { user } = useUser();
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Ensure the latest state is captured if a manual sync is provided
      if (onSaveState) {
        onSaveState();
      }

      const data: ExportData = {
        version: '1.0.0', // Should come from constants ideally
        timestamp: new Date().toISOString(),
        projectId,
        projectName,
        flows,
        activeFlowId,
      };

      const { content, extension, mimeType } = await ExportImportService.export(format, data);
      
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (projectName || 'project').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      a.download = `vectorflow-${safeName}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Project Exported",
        description: `Successfully exported your project as ${format.toUpperCase()}.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while exporting your project.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension) throw new Error('Could not determine file type');

      const data = await ExportImportService.import(extension, file);
      
      onImport(data.flows, data.activeFlowId, data.projectId, data.projectName);

      toast({
        title: "Project Imported",
        description: "Successfully loaded project from file.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "The file could not be imported. Please ensure it's a valid VectorFlow export.",
      });
    } finally {
      setIsImporting(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleCloudSave = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in with Google to save to the cloud.",
      });
      return;
    }

    setIsCloudLoading(true);
    try {
      if (onSaveState) onSaveState();
      await handleSaveToCloud();
    } finally {
      setIsCloudLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          <span>Export / Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Portability</DialogTitle>
          <DialogDescription>
            Export your project to share it or import a previously saved file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Google Drive Section - Premium Feature */}
          <div className="space-y-4 p-4 rounded-xl border bg-muted/30 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-sm">Cloud Storage</h4>
              </div>
              {cloudProjectId && (
                <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-medium animate-in fade-in duration-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Linked</span>
                </div>
              )}
            </div>

            {!user ? (
              <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                 <p className="text-xs text-muted-foreground">Sign in to auto-save your projects to the cloud.</p>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-700 text-[10px] rounded border border-yellow-100">
                  <AlertCircle className="w-3 h-3" />
                  <span>Portability requires a Google Account</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cloudProjectId && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        syncState.syncStatus === 'saving' ? 'bg-blue-500 animate-pulse' :
                        syncState.syncStatus === 'saved' ? 'bg-green-500' :
                        syncState.syncStatus === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="text-xs">
                        <div className="font-medium">
                          {syncState.syncStatus === 'saving' ? 'Saving to cloud...' :
                           syncState.syncStatus === 'saved' ? 'Saved to cloud' :
                           syncState.syncStatus === 'error' ? 'Auto-save Error' :
                           'Auto-save Off'}
                        </div>
                        {syncState.lastSyncTime && (
                          <div className="text-[10px] text-muted-foreground">
                            Last synced: {syncState.lastSyncTime.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={syncState.isSyncEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleSync}
                      className="h-7 text-xs"
                    >
                      {syncState.isSyncEnabled ? 'Disable Auto-Save' : 'Enable Auto-Save'}
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant={cloudProjectId ? "default" : "outline"} 
                    className="flex-1 h-9 gap-2 shadow-sm"
                    onClick={handleCloudSave}
                    disabled={isCloudLoading || syncState.isSyncEnabled}
                  >
                    {isCloudLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : cloudProjectId ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Save Now
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" />
                        Save to Cloud
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-9 w-9 p-0"
                    onClick={handleOpenCloudProject}
                    disabled={isCloudLoading}
                    title="Open Project"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm leading-none flex items-center gap-2">
              <Download className="w-4 h-4" />
              Local Export
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="format" className="text-xs">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format" className="h-9">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4" />
                        <span>JSON (Generic)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleExport} 
                disabled={isExporting} 
                className="mt-6 h-9"
              >
                {isExporting ? 'Exporting...' : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
              <span className="bg-background px-3">Or</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm leading-none flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Local Import
            </h4>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="import-file" className="text-xs sr-only">Select File</Label>
              <Input 
                id="import-file" 
                type="file" 
                accept=".json" 
                onChange={handleImport}
                disabled={isImporting}
                className="h-9 text-xs file:text-xs file:font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-[10px] text-muted-foreground border border-border/50">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Safety Note:</strong> Local imports will completely 
            overwrite current session data. To keep your current work, save it to the cloud first.
          </p>
        </div>
      </DialogContent>
      

    </Dialog>
  );
}
