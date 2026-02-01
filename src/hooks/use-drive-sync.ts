import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useUser } from '@/firebase/auth/use-user';
import { ExportData } from '@/lib/export-import';
import { Flow } from '@/types';

const POLL_INTERVAL = 10000; // 10 seconds
const AUTO_SAVE_DELAY = 3000; // 3 seconds after last edit

export interface SyncState {
  isSyncEnabled: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';
  lastSyncTime: Date | null;
  hasConflict: boolean;
  errorMessage?: string;
  isReadOnlyDueToPermissions: boolean;
}

interface UseDriveSyncProps {
  fileId: string | undefined;
  projectId: string;
  projectName: string;
  flows: Flow[];
  activeFlowId: string;
  onImport: (flows: Flow[], activeFlowId: string, projectId: string, projectName?: string, driveId?: string) => void;
  onPermissionsChange?: (canEdit: boolean) => void;
}

export function useDriveSync({
  fileId,
  projectId,
  projectName,
  flows,
  activeFlowId,
  onImport,
  onPermissionsChange,
}: UseDriveSyncProps) {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncEnabled: false,
    syncStatus: 'idle',
    lastSyncTime: null,
    hasConflict: false,
    isReadOnlyDueToPermissions: false,
  });

  const lastRemoteModifiedTime = useRef<string | null>(null);
  const lastLocalEditTime = useRef<Date>(new Date());
  const hasUnsavedChanges = useRef(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Track local changes
  useEffect(() => {
    if (syncState.isSyncEnabled && fileId) {
      lastLocalEditTime.current = new Date();
      hasUnsavedChanges.current = true;

      // Clear existing timeout
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }

      // Debounced auto-save
      autoSaveTimeout.current = setTimeout(() => {
        if (syncState.isSyncEnabled && !syncState.hasConflict) {
          pushLocalChanges();
        }
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [flows, activeFlowId, syncState.isSyncEnabled, syncState.hasConflict]);

  const { user } = useUser();

  // Check permissions when fileId changes
  useEffect(() => {
    if (!fileId) {
      // Clear read-only state when no file is linked
      setSyncState(prev => {
        if (prev.isReadOnlyDueToPermissions) {
          return { ...prev, isReadOnlyDueToPermissions: false };
        }
        return prev;
      });
      return;
    }

    // Don't check permissions if user is not authenticated
    if (!user) {
      return;
    }

    // Only check permissions if we have a valid fileId and authenticated user
    let cancelled = false;
    
    GoogleDriveService.getFilePermissions(fileId)
      .then(({ canEdit }) => {
        if (cancelled) return;
        
        const isReadOnly = !canEdit;
        setSyncState(prev => {
          if (prev.isReadOnlyDueToPermissions !== isReadOnly) {
            return { ...prev, isReadOnlyDueToPermissions: isReadOnly };
          }
          return prev;
        });
        
        // Only call callback if changing to read-only
        if (isReadOnly) {
          onPermissionsChange?.(true);
        }
      })
      .catch(error => {
        if (cancelled) return;
        console.error('Failed to check file permissions:', error);
        // Don't force read-only on error, just log it
      });
      
    return () => {
      cancelled = true;
    };
  }, [fileId]); // Removed onPermissionsChange from dependencies to prevent infinite loop

  // Push local changes to Drive
  const pushLocalChanges = useCallback(async () => {
    if (!fileId || syncState.hasConflict) return;

    try {
      setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));

      const data: ExportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        projectId,
        projectName,
        flows,
        activeFlowId,
        googleDriveFileId: fileId,
      };

      await GoogleDriveService.updateFile(fileId, data);
      
      // Update last remote time after successful push
      const metadata = await GoogleDriveService.getFileMetadata(fileId);
      lastRemoteModifiedTime.current = metadata.modifiedTime;
      hasUnsavedChanges.current = false;

      setSyncState(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncTime: new Date(),
      }));
    } catch (error: any) {
      console.error('Push failed:', error);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: error.message || 'Failed to save to Drive',
      }));
    }
  }, [fileId, projectId, projectName, flows, activeFlowId, syncState.hasConflict]);

  // Pull remote changes from Drive
  const pullRemoteChanges = useCallback(async () => {
    if (!fileId) return;

    try {
      setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));

      const data = await GoogleDriveService.getFileContent(fileId);
      onImport(data.flows, data.activeFlowId, data.projectId, data.projectName, fileId);

      const metadata = await GoogleDriveService.getFileMetadata(fileId);
      lastRemoteModifiedTime.current = metadata.modifiedTime;
      hasUnsavedChanges.current = false;

      setSyncState(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncTime: new Date(),
      }));
    } catch (error: any) {
      console.error('Pull failed:', error);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: error.message || 'Failed to load from Drive',
      }));
    }
  }, [fileId, onImport]);

  // Poll for remote changes
  useEffect(() => {
    if (!syncState.isSyncEnabled || !fileId || syncState.hasConflict) {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      return;
    }

    // Check if we have a valid access token
    const token = GoogleDriveService.getAccessToken();
    if (!token) {
      console.error('No access token available for sync');
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Not authenticated. Please sign in again.',
        isSyncEnabled: false,
      }));
      return;
    }

    // Initial metadata fetch
    if (!lastRemoteModifiedTime.current) {
      GoogleDriveService.getFileMetadata(fileId)
        .then(metadata => {
          lastRemoteModifiedTime.current = metadata.modifiedTime;
        })
        .catch(error => {
          console.error('Initial metadata fetch failed:', error);
          setSyncState(prev => ({
            ...prev,
            syncStatus: 'error',
            errorMessage: 'Failed to connect to Drive. Please check your authentication.',
            isSyncEnabled: false,
          }));
        });
    }

    // Poll for changes
    pollInterval.current = setInterval(async () => {
      // Only poll when tab is active
      if (document.hidden) return;

      try {
        const metadata = await GoogleDriveService.getFileMetadata(fileId);
        
        if (lastRemoteModifiedTime.current && metadata.modifiedTime > lastRemoteModifiedTime.current) {
          // Remote file has changed
          if (hasUnsavedChanges.current) {
            // Conflict detected!
            setSyncState(prev => ({
              ...prev,
              syncStatus: 'conflict',
              hasConflict: true,
            }));
          } else {
            // No local changes, safe to pull
            await pullRemoteChanges();
          }
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        // If auth error, disable sync
        if (error.message?.includes('authentication') || error.message?.includes('OAuth')) {
          setSyncState(prev => ({
            ...prev,
            syncStatus: 'error',
            errorMessage: 'Authentication expired. Please sign in again.',
            isSyncEnabled: false,
          }));
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [syncState.isSyncEnabled, fileId, syncState.hasConflict, pullRemoteChanges]);

  // Toggle sync on/off
  const toggleSync = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      isSyncEnabled: !prev.isSyncEnabled,
      syncStatus: !prev.isSyncEnabled ? 'idle' : prev.syncStatus,
      hasConflict: false,
    }));
  }, []);

  // Resolve conflict by choosing local version
  const resolveConflictKeepLocal = useCallback(async () => {
    if (!fileId) return;
    
    hasUnsavedChanges.current = true;
    setSyncState(prev => ({ ...prev, hasConflict: false }));
    await pushLocalChanges();
  }, [fileId, pushLocalChanges]);

  // Resolve conflict by choosing remote version
  const resolveConflictKeepRemote = useCallback(async () => {
    if (!fileId) return;
    
    await pullRemoteChanges();
    setSyncState(prev => ({ ...prev, hasConflict: false }));
  }, [fileId, pullRemoteChanges]);

  return {
    syncState,
    toggleSync,
    resolveConflictKeepLocal,
    resolveConflictKeepRemote,
    manualSync: pushLocalChanges,
  };
}
