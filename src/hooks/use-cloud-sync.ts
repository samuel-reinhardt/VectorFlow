/**
 * Replaces `use-drive-sync.ts`. Provides the same external interface
 * (`syncState`, `toggleSync`, `manualSync`) but persists to Cloudflare D1
 * via the `/api/projects/:id` Edge route instead of Google Drive.
 *
 * Local-only mode (no sign-in) works exactly as before — the sync hook
 * simply stays in `idle` state and localStorage provides persistence.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import type { ExportData } from '@/lib/export-import';
import type { Flow } from '@/types';

const AUTO_SAVE_DELAY = 3000; // ms after last edit before pushing

export interface SyncState {
  isSyncEnabled: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSyncTime: Date | null;
  errorMessage?: string;
  errorType?: 'auth' | 'network' | 'generic';
  /** Always false — D1 projects are owned, never read-only for the owner. */
  isReadOnlyDueToPermissions: false;
}

interface UseCloudSyncProps {
  /** D1 project ID (UUID). Undefined when no cloud project is linked. */
  cloudProjectId: string | undefined;
  projectName: string;
  flows: Flow[];
  activeFlowId: string;
  onImport: (
    flows: Flow[],
    activeFlowId: string,
    projectId: string,
    projectName?: string,
    cloudProjectId?: string,
  ) => void;
}

export function useCloudSync({
  cloudProjectId,
  projectName,
  flows,
  activeFlowId,
  onImport,
}: UseCloudSyncProps) {
  const { user } = useUser();

  const [syncState, setSyncState] = useState<SyncState>({
    isSyncEnabled: false,
    syncStatus: 'idle',
    lastSyncTime: null,
    isReadOnlyDueToPermissions: false,
  });

  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-enable sync when a cloud projectId is linked and user is signed in
  useEffect(() => {
    const enabled = !!(cloudProjectId && user);
    setSyncState((prev) =>
      prev.isSyncEnabled !== enabled
        ? { ...prev, isSyncEnabled: enabled, syncStatus: enabled ? prev.syncStatus : 'idle' }
        : prev,
    );
  }, [cloudProjectId, user]);

  // Debounced auto-save on any flow change
  useEffect(() => {
    if (!syncState.isSyncEnabled || !cloudProjectId) return;

    setSyncState((prev) =>
      prev.syncStatus !== 'saving' ? { ...prev, syncStatus: 'saving' } : prev,
    );

    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(() => {
      pushLocalChanges();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flows, activeFlowId, syncState.isSyncEnabled, cloudProjectId]);

  /** Pushes the current project state to D1 via PUT /api/projects/:id. */
  const pushLocalChanges = useCallback(async () => {
    if (!cloudProjectId || !user) return;

    const data: ExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projectId: cloudProjectId,
      projectName,
      flows,
      activeFlowId,
    };

    try {
      setSyncState((prev) => ({ ...prev, syncStatus: 'saving' }));

      const res = await fetch(`/api/projects/${cloudProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, data }),
      });

      if (res.status === 401) {
        setSyncState((prev) => ({
          ...prev,
          syncStatus: 'error',
          errorType: 'auth',
          errorMessage: 'Session expired. Please sign in again.',
        }));
        return;
      }

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      setSyncState((prev) => ({
        ...prev,
        syncStatus: 'saved',
        lastSyncTime: new Date(),
        errorMessage: undefined,
        errorType: undefined,
      }));
    } catch (err: any) {
      const isNetwork =
        err.message?.includes('fetch') ||
        err.message?.includes('network') ||
        err.message?.includes('Failed to fetch');

      setSyncState((prev) => ({
        ...prev,
        syncStatus: 'error',
        errorType: isNetwork ? 'network' : 'generic',
        errorMessage: isNetwork
          ? 'Cloud connection lost. Retrying...'
          : err.message || 'Failed to auto-save.',
      }));
    }
  }, [cloudProjectId, projectName, flows, activeFlowId, user]);

  const toggleSync = useCallback(() => {
    setSyncState((prev) => ({ ...prev, isSyncEnabled: !prev.isSyncEnabled }));
  }, []);

  return {
    syncState,
    toggleSync,
    manualSync: pushLocalChanges,
  };
}
