import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useUser } from '@/firebase/auth/use-user';
import { ExportData } from '@/lib/export-import';
import { Flow } from '@/types';

const AUTO_SAVE_DELAY = 3000; // 3 seconds after last edit

export interface SyncState {
  isSyncEnabled: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSyncTime: Date | null;
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
    isReadOnlyDueToPermissions: false,
  });

  const lastLocalEditTime = useRef<Date>(new Date());
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-enable sync when fileId is present
  useEffect(() => {
    if (fileId) {
      setSyncState(prev => ({ ...prev, isSyncEnabled: true }));
    } else {
        setSyncState(prev => ({ ...prev, isSyncEnabled: false, syncStatus: 'idle' }));
    }
  }, [fileId]);

  // Track local changes and trigger auto-save
  useEffect(() => {
    if (syncState.isSyncEnabled && fileId) {
      lastLocalEditTime.current = new Date();
      
      // Update status to "saving" (pending)
      setSyncState(prev => {
          // Verify we aren't already in error state which might need manual retry
          // But for auto-save, we usually just retry.
          // Let's show saving immediately to indicate dirty state
          if (prev.syncStatus !== 'saving') {
              return { ...prev, syncStatus: 'saving' };
          }
          return prev;
      });

      // Clear existing timeout
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }

      // Debounced auto-save
      autoSaveTimeout.current = setTimeout(() => {
        if (syncState.isSyncEnabled) {
          pushLocalChanges();
        }
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [flows, activeFlowId, syncState.isSyncEnabled, fileId]);

  const { user } = useUser();

  // Check permissions when fileId changes
  useEffect(() => {
    if (!fileId) {
      setSyncState(prev => {
        if (prev.isReadOnlyDueToPermissions) {
          return { ...prev, isReadOnlyDueToPermissions: false };
        }
        return prev;
      });
      return;
    }

    if (!user) return;

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
        
        if (isReadOnly) {
          onPermissionsChange?.(true);
        }
      })
      .catch(error => {
        if (cancelled) return;
        console.error('Failed to check file permissions:', error);
      });
      
    return () => {
      cancelled = true;
    };
  }, [fileId, user]); // Clean deps

  // Push local changes to Drive (Auto-Save)
  const pushLocalChanges = useCallback(async () => {
    if (!fileId) return;

    try {
      // Check for auth token first
      if (!GoogleDriveService.getAccessToken()) {
        setSyncState(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: 'Session expired. Please sign in again.',
          isSyncEnabled: false
        }));
        return;
      }

      setSyncState(prev => ({ ...prev, syncStatus: 'saving' }));

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
      
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'saved',
        lastSyncTime: new Date(),
        errorMessage: undefined
      }));
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      
      const isAuthError = error.message?.includes('authentication') || error.message?.includes('token') || error.message?.includes('401');
      const friendlyMessage = isAuthError 
        ? 'Session expired. Please sign in again to resume saving.'
        : (error.message || 'Failed to auto-save to Drive');

      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: friendlyMessage,
        // If auth error, disable sync to prevent infinite loops/toast spam
        isSyncEnabled: isAuthError ? false : prev.isSyncEnabled
      }));
    }
  }, [fileId, projectId, projectName, flows, activeFlowId]);

  // Initial Pull (Load)
  // We likely rely on the main app logic to load first, but if we need a manual pull function:
  const pullRemoteChanges = useCallback(async () => {
      // NOTE: This now overwrites local without checking timestamps. 
      // Should be used carefully (e.g. initial load or explicit "Revert")
      if (!fileId) return;
      // Implementation similar to before if needed, or rely on `loadProject` passed from parent
  }, [fileId]);

  const toggleSync = useCallback(() => {
    // With auto-save, "toggle sync" might just mean unlinking or pausing.
    // For now, let's just update the enabled state, but mostly it's fileId driven.
    setSyncState(prev => ({ ...prev, isSyncEnabled: !prev.isSyncEnabled }));
  }, []);

  return {
    syncState,
    toggleSync,
    // No conflict resolution functions needed anymore
    manualSync: pushLocalChanges,
  };
}
