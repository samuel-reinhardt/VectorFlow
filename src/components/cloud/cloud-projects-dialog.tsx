'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/layout/tabs';
import { FolderOpen, Cloud, Globe, Trash2, Loader2, Share2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { ProjectMeta } from '@/lib/db';

interface CloudProjectsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProject: (projectId: string, permissionLevel: 'owner' | 'edit' | 'read') => void;
  onDeleteProject: (projectId: string, projectName: string) => Promise<void>;
}

export function CloudProjectsDialog({
  isOpen,
  onOpenChange,
  onOpenProject,
  onDeleteProject,
}: CloudProjectsDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [myProjects, setMyProjects] = useState<ProjectMeta[]>([]);
  const [discoverableProjects, setDiscoverableProjects] = useState<any[]>([]);
  
  const [isLoadingMyProjects, setIsLoadingMyProjects] = useState(false);
  const [isLoadingDiscoverable, setIsLoadingDiscoverable] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyProjects();
      fetchDiscoverableProjects();
    }
    
    // Safety fallback for Radix UI body pointer-events lock bug
    let timeoutId: NodeJS.Timeout;
    if (!isOpen) {
      timeoutId = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, user]);

  const fetchMyProjects = async () => {
    setIsLoadingMyProjects(true);
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setMyProjects(data.projects || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error loading projects', description: err.message });
    } finally {
      setIsLoadingMyProjects(false);
    }
  };

  const fetchDiscoverableProjects = async () => {
    setIsLoadingDiscoverable(true);
    try {
      const res = await fetch('/api/discovery', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch discoverable projects');
      const data = await res.json();
      setDiscoverableProjects(data.projects || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error loading discovery', description: err.message });
    } finally {
      setIsLoadingDiscoverable(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    await onDeleteProject(id, name);
    fetchMyProjects(); // Refresh after delete
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Manage Cloud Flows
            </DialogTitle>
            <DialogDescription>
              Browse your personal flows or explore flows shared within your domain.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden p-6 pt-2">
          <Tabs defaultValue="my-flows" className="h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="my-flows" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                My Flows
              </TabsTrigger>
              <TabsTrigger value="discoverable" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Discoverable
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-flows" className="flex-1 overflow-auto m-0 p-1">
              {isLoadingMyProjects ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <p>Loading your flows...</p>
                </div>
              ) : myProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 border-2 border-dashed rounded-xl p-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                  <p>You haven't saved any flows to the cloud yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myProjects.map((project) => (
                    <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow gap-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{project.name}</h3>
                          {project.isDiscoverable ? (
                            <span title="Discoverable">
                              <Share2 className="h-3.5 w-3.5 text-blue-500" />
                            </span>
                          ) : (
                            <span title="Private">
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            onOpenProject(project.id, 'owner');
                            onOpenChange(false);
                          }}
                        >
                          Open
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                          onClick={() => handleDelete(project.id, project.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discoverable" className="flex-1 overflow-auto m-0 p-1">
              {isLoadingDiscoverable ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <p>Discovering flows...</p>
                </div>
              ) : discoverableProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 border-2 border-dashed rounded-xl p-8">
                  <Globe className="h-12 w-12 text-muted-foreground/30" />
                  <p>No discoverable flows found for your domain.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discoverableProjects.map((project) => (
                    <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow gap-4">
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          By {project.ownerEmail || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Button 
                          variant={project.permissionLevel === 'edit' ? 'outline' : 'default'} 
                          size="sm" 
                          className="flex-1 sm:flex-none w-full"
                          onClick={() => {
                            onOpenProject(project.id, project.permissionLevel || 'read');
                            onOpenChange(false);
                          }}
                        >
                          {project.permissionLevel === 'edit' ? 'Open' : 'Open as Copy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
