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
import { Download, Upload, FileJson, Share2, AlertCircle } from 'lucide-react';
import { ExportImportService, ExportData } from '@/lib/export-import';
import { Flow } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  flows: Flow[];
  activeFlowId: string;
  onImport: (flows: Flow[], activeFlowId: string) => void;
  onSaveState?: () => void;
}

export function ExportDialog({ flows, activeFlowId, onImport, onSaveState }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
        flows,
        activeFlowId,
      };

      const { content, extension, mimeType } = await ExportImportService.export(format, data);
      
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vectorflow-export-${new Date().toISOString().split('T')[0]}.${extension}`;
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
      
      onImport(data.flows, data.activeFlowId);

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
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Export Project</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4" />
                        <span>JSON (Full Project)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleExport} 
                disabled={isExporting} 
                className="mt-6"
              >
                {isExporting ? 'Exporting...' : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium leading-none">Import Project</h4>
            <p className="text-xs text-muted-foreground">
              Warning: Importing a file will replace your current project data.
            </p>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="import-file">Select File</Label>
              <Input 
                id="import-file" 
                type="file" 
                accept=".json" 
                onChange={handleImport}
                disabled={isImporting}
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-[10px] text-muted-foreground">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <p>
            JSON exports include all flows, steps, and visual settings. 
            Importing a file will overwrite your local changes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
