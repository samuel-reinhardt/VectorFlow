
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useToast } from '@/hooks/use-toast';
import { Flow, EMPTY_META_CONFIG } from '@/types';
import { useDriveBrowser } from '@/components/drive/drive-browser-dialog';

interface UseDriveFileActionsProps {
    user: any;
    accessToken: string | null;
    projectId: string;
    projectName: string;
    flows: Flow[];
    activeFlowId: string;
    loadProject: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string, driveId?: string) => void;
    setGoogleDriveFileId: (id: string | undefined) => void;
    requestFileName: (title: string, defaultValue?: string, description?: string, confirmLabel?: string) => Promise<string | null>;
}

export function useDriveFileActions({
    user,
    accessToken,
    projectId,
    projectName,
    flows,
    activeFlowId,
    loadProject,
    setGoogleDriveFileId,
    requestFileName,
}: UseDriveFileActionsProps) {
    const { toast } = useToast();
    const { openBrowser, driveBrowserProps } = useDriveBrowser();

    const handleBrowseDrive = async () => {
        if (!user || !accessToken) {
            toast({
                title: "Login Required",
                description: "Please sign in with Google to browse Drive.",
            });
            return;
        }

        openBrowser({
            mode: 'file',
            title: 'Open Project',
            onSelect: async (file) => {
                try {
                    const data = await GoogleDriveService.getFileContent(file.id);
                    loadProject(data.flows, data.activeFlowId, data.projectId, data.projectName, file.id);
                    toast({
                        title: "Project Loaded",
                        description: `Successfully imported "${file.name}" from Google Drive.`,
                    });
                } catch (error: any) {
                    console.error('Projects load error:', error);
                    toast({
                        variant: "destructive",
                        title: "Load Failed",
                        description: "Failed to load project file.",
                    });
                }
            }
        });
    };

    const handleCreateDriveFile = async () => {
        if (!user || !accessToken) {
            toast({
                title: "Login Required",
                description: "Please sign in with Google to create a file.",
            });
            return;
        }

        const name = await requestFileName("Save to Google Drive", projectName || "vectorflow-project", "Enter a name for the file.", "Select Folder");
        if (!name) return;

        openBrowser({
            mode: 'folder',
            title: 'Select Destination Folder',
            confirmLabel: 'Save Here',
            onSelect: async (folder) => {
                try {
                    const data = {
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                        projectId,
                        projectName: name,
                        flows,
                        activeFlowId,
                    };

                    let finalName = name.trim();
                    if (!finalName.toLowerCase().endsWith('.json')) {
                        finalName += '.json';
                    }

                    const fileId = await GoogleDriveService.createFile(
                        finalName,
                        data,
                        folder.id
                    );
                    
                    setGoogleDriveFileId(fileId);
                    loadProject(flows, activeFlowId, projectId, name, fileId);
                    
                    toast({
                        title: "File Created",
                        description: `Successfully created "${finalName}" in Google Drive.`,
                    });
                } catch (err: any) {
                        console.error('File creation error:', err);
                        toast({
                        variant: "destructive",
                        title: "Creation Failed",
                        description: err.message || "Failed to create file.",
                    });
                }
            }
        });
    };

    const handleNewCloud = async () => {
        if (!user || !accessToken) {
            toast({
                title: "Login Required",
                description: "Please sign in with Google to create a file.",
            });
            return;
        }

        if (!confirm("Are you sure you want to create a new project? Unsaved changes will be lost.")) return;

        const name = await requestFileName("New Cloud Project", "Untitled Project", "Enter a name for your new project.", "Select Folder");
        if (!name) return;

        openBrowser({
            mode: 'folder',
            title: 'Select Destination Folder',
            confirmLabel: 'Create Here',
            onSelect: async (folder) => {
                try {
                    const newProjectId = crypto.randomUUID();
                    const defaultFlow: Flow = {
                        id: '1',
                        title: 'Main Flow',
                        nodes: [],
                        edges: [],
                        metaConfig: EMPTY_META_CONFIG
                    };

                    const data = {
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                        projectId: newProjectId,
                        projectName: name,
                        flows: [defaultFlow],
                        activeFlowId: '1',
                    };

                    let finalName = name.trim();
                    if (!finalName.toLowerCase().endsWith('.json')) {
                        finalName += '.json';
                    }

                    const fileId = await GoogleDriveService.createFile(
                        finalName,
                        data,
                        folder.id
                    );
                    
                    setGoogleDriveFileId(fileId);
                    loadProject([defaultFlow], '1', newProjectId, name, fileId);
                    
                    toast({
                        title: "Project Created",
                        description: `Successfully created "${finalName}" in Google Drive.`,
                    });
                } catch (err: any) {
                    console.error('Cloud project creation error:', err);
                    toast({
                        variant: "destructive",
                        title: "Creation Failed",
                        description: err.message || "Failed to create project.",
                    });
                }
            }
        });
    };
    
    return { handleBrowseDrive, handleCreateDriveFile, handleNewCloud, driveBrowserProps };
}
