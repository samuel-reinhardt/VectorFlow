
import { ExportImportService } from '@/lib/export-import';
import { useToast } from '@/hooks/use-toast';
import { Flow } from '@/types';

interface UseLocalFileActionsProps {
    projectId: string;
    projectName: string;
    flows: Flow[];
    activeFlowId: string;
    loadProject: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string, driveId?: string | undefined) => void;
    setGoogleDriveFileId: (id: string | undefined) => void;
    requestFileName: (title: string, defaultValue?: string, description?: string, confirmLabel?: string) => Promise<string | null>;
}

export function useLocalFileActions({
    projectId,
    projectName,
    flows,
    activeFlowId,
    loadProject,
    setGoogleDriveFileId,
    requestFileName,
}: UseLocalFileActionsProps) {
    const { toast } = useToast();

    const handleNewLocal = async () => {
        if (!confirm("Are you sure you want to create a new project? Unsaved changes will be lost.")) return;

        const name = await requestFileName("New Project Name", "Untitled Project", "Enter a name for your new project.", "Create");
        if (!name) return;

        loadProject([], '', crypto.randomUUID(), name, undefined);
        setGoogleDriveFileId(undefined); // Unlink drive file
    };

    const handleExport = async () => {
        const name = await requestFileName("Export Project", projectName || "project", "Enter a filename for the export.", "Export");
        if (!name) return;

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
            
            let fileName = name.trim();
            if (!fileName.toLowerCase().endsWith('.json')) {
                fileName += '.json';
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Project Exported",
                description: `Saved as ${fileName}`,
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
                
                // loadProject signature: (flows, activeFlowId, projectId, projectName, driveId)
                loadProject(data.flows, data.activeFlowId, data.projectId, data.projectName, undefined);

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

    return { handleNewLocal, handleExport, handleImport };
}
