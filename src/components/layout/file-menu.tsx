import { useState } from 'react';
import { Download, Upload, FileJson, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlay/dropdown-menu';
import { Input } from '@/components/ui/forms/input';
import { ExportImportService } from '@/lib/export-import';
import { Flow } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FileMenuProps {
  flows: Flow[];
  activeFlowId: string;
  projectId: string;
  projectName: string;
  onImport: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string) => void;
  onClear?: () => void;
}

export function FileMenu({
  flows,
  activeFlowId,
  projectId,
  projectName,
  onImport,
  onClear,
}: FileMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop() || 'json';
      const data = await ExportImportService.import(extension, file);
      
      onImport(data.flows, data.activeFlowId, data.projectId, data.projectName);

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

    // Reset input
    event.target.value = '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
          <span className="sr-only">File menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export JSON'}
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <label className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </DropdownMenuItem>

        {onClear && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClear}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Canvas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
