/**
 * Replaces `use-drive-file-actions.ts`. Provides project creation, cloud
 * open, and deletion backed by Cloudflare D1 via the `/api/projects` routes.
 *
 * All operations require the user to be signed in. The hook gracefully
 * surfaces auth and network errors via toast notifications.
 */

'use client';

import { useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useFileNameDialog } from '@/hooks/use-file-name-dialog';
import type { Flow } from '@/types';
import { EMPTY_META_CONFIG } from '@/types';
import type { ExportData } from '@/lib/export-import';



interface UseProjectActionsProps {
  flows: Flow[];
  activeFlowId: string;
  projectId: string;
  projectName: string;
  cloudProjectId: string | undefined;
  setCloudProjectId: (id: string) => void;
  loadProject: (
    flows: Flow[],
    activeFlowId: string,
    projectId: string,
    name: string,
    cloudProjectId: string,
  ) => void;
}

export function useProjectActions({
  flows,
  activeFlowId,
  projectId,
  projectName,
  cloudProjectId,
  setCloudProjectId,
  loadProject,
}: UseProjectActionsProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { requestFileName } = useFileNameDialog();

  /** Saves the current project to D1. Creates if new, updates if linked. */
  const handleSaveToCloud = useCallback(async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to save to the cloud.' });
      return;
    }

    const data: ExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projectId: cloudProjectId || projectId, // If already cloud linked, preserve that ID
      projectName,
      flows,
      activeFlowId,
    };

    try {
      if (!cloudProjectId) {
        // First cloud save for this project — create it.
        const createRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, data }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({})) as any;
          throw new Error(err.error ?? `Create failed: ${createRes.status}`);
        }

        setCloudProjectId(projectId);
        toast({ title: 'Saved to cloud', description: `"${projectName}" saved to your account.` });
        return;
      }

      // It is already linked to the cloud, update it
      const updateRes = await fetch(`/api/projects/${cloudProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, data }),
      });

      if (updateRes.status === 404) {
        // The project was likely deleted from the cloud database but is still linked locally.
        // Recreate it silently.
        const createRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, data }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({})) as any;
          throw new Error(err.error ?? `Re-create failed: ${createRes.status}`);
        }

        toast({ title: 'Saved to cloud', description: `"${projectName}" saved to your account.` });
        return;
      }

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({})) as any;
        throw new Error(err.error ?? `Update failed: ${updateRes.status}`);
      }

      toast({ title: 'Saved', description: `"${projectName}" updated in the cloud.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    }
  }, [user, projectId, cloudProjectId, projectName, flows, activeFlowId, setCloudProjectId, toast]);

  /** Creates a brand-new cloud project (prompts for name). */
  const handleNewCloudProject = useCallback(async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create a cloud project.' });
      return;
    }

    if (!confirm('Create a new project? Unsaved local changes will be lost.')) return;

    const name = await requestFileName('New Cloud Project', 'Untitled Project', 'Enter a project name.');
    if (!name) return;

    const newProjectId = crypto.randomUUID();
    const defaultFlow: Flow = {
      id: '1',
      title: 'Main Flow',
      nodes: [],
      edges: [],
      metaConfig: EMPTY_META_CONFIG,
    };

    const data: ExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projectId: newProjectId,
      projectName: name,
      flows: [defaultFlow],
      activeFlowId: '1',
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as any;
        throw new Error(body.error ?? `Create failed: ${res.status}`);
      }

      loadProject([defaultFlow], '1', newProjectId, name, newProjectId);
      toast({ title: 'Project created', description: `"${name}" created in the cloud.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Creation failed', description: err.message });
    }
  }, [user, requestFileName, loadProject, toast]);

  /** Opens a cloud project by fetching it from D1. */
  const handleOpenCloudProject = useCallback(
    async (cloudProjectId: string, isDiscoverable: boolean = false) => {
      try {
        const url = isDiscoverable 
          ? `/api/discovery?projectId=${cloudProjectId}`
          : `/api/projects/${cloudProjectId}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Project not found (${res.status})`);
        }
        const { project } = await res.json() as { project: { data: ExportData; name: string } };
        loadProject(
          project.data.flows,
          project.data.activeFlowId,
          project.data.projectId,
          project.data.projectName ?? project.name,
          cloudProjectId,
        );
        toast({ title: 'Project opened', description: `"${project.data.projectName}" loaded from cloud.` });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Open failed', description: err.message });
      }
    },
    [loadProject, toast],
  );

  /** Deletes a cloud project. */
  const handleDeleteCloudProject = useCallback(
    async (cloudProjectId: string, name: string) => {
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

      try {
        const res = await fetch(`/api/projects/${cloudProjectId}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as any;
          throw new Error(body.error ?? `Delete failed: ${res.status}`);
        }
        toast({ title: 'Project deleted', description: `"${name}" has been removed.` });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
      }
    },
    [toast],
  );

  return {
    handleSaveToCloud,
    handleNewCloudProject,
    handleOpenCloudProject,
    handleDeleteCloudProject,
  };
}
