import { Cloud, FileJson, Users, Shield, LogIn, Info } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { SyncState } from '@/hooks/use-drive-sync';

interface SyncPopoverProps {
  user: any;
  syncState: SyncState;
  googleDriveFileId?: string;
  projectId: string;
  projectName: string;
  onToggleSync: () => void;
  onBrowseDrive: () => void;
  onCreateFile?: () => void;
  onUnlink: () => void;
}

export function SyncPopover({
  user,
  syncState,
  googleDriveFileId,
  projectId,
  projectName,
  onToggleSync,
  onBrowseDrive,
  onCreateFile,
  onUnlink,
}: SyncPopoverProps) {
  // Not signed in - show benefits
  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-1">Google Drive Auto-Save</h3>
          <p className="text-xs text-muted-foreground">Sign in to unlock cloud features</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-xs">Auto-save to cloud</div>
              <div className="text-[10px] text-muted-foreground">Never lose your work</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <FileJson className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-xs">Access from anywhere</div>
              <div className="text-[10px] text-muted-foreground">Work on any device</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-xs">Share with team</div>
              <div className="text-[10px] text-muted-foreground">Collaborate with peers</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-xs">Secure & private</div>
              <div className="text-[10px] text-muted-foreground">Your data stays in your Drive</div>
            </div>
          </div>
        </div>

        <Button className="w-full gap-2" size="sm">
          <LogIn className="w-4 h-4" />
          Sign In with Google
        </Button>
      </div>
    );
  }

  // Signed in but no file linked
  if (!googleDriveFileId) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-1">Google Drive Auto-Save</h3>
          <p className="text-xs text-muted-foreground">Connect this project to Drive</p>
        </div>

        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Cloud className="w-12 h-12 opacity-20" />
        </div>

        <div className="space-y-2">
          <Button className="w-full gap-2" size="sm" onClick={onBrowseDrive}>
            <FileJson className="w-4 h-4" />
            Open Existing File
          </Button>
          <Button variant="outline" className="w-full gap-2" size="sm" onClick={onCreateFile || onBrowseDrive}>
            <Cloud className="w-4 h-4" />
            Create New File
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="text-xs font-medium">Benefits:</div>
          <ul className="text-[10px] text-muted-foreground space-y-1">
            <li>• Auto-save your work every 3 seconds</li>
            <li>• Access from any device</li>
            <li>• Collaborate with teammates</li>
          </ul>
        </div>
      </div>
    );
  }

  // Signed in with file linked
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Google Drive Auto-Save</h3>
        <p className="text-xs text-muted-foreground truncate" title={`${projectName}.json`}>
          📄 {projectName}.json
        </p>
      </div>

      {/* Status Indicator */}
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            syncState.syncStatus === 'saving' ? 'bg-blue-500 animate-pulse' :
            syncState.syncStatus === 'saved' ? 'bg-green-500' :
            syncState.syncStatus === 'error' ? 'bg-red-500' :
            'bg-gray-400'
          }`} />
          <div className="flex-1">
            <div className="text-xs font-medium">
              {syncState.syncStatus === 'saving' ? 'Saving to Drive...' :
               syncState.syncStatus === 'saved' ? 'All changes saved' :
               syncState.syncStatus === 'error' ? 'Auto-save error' :
               'Auto-save enabled'}
            </div>
            {syncState.lastSyncTime && syncState.syncStatus === 'saved' && (
              <div className="text-[10px] text-muted-foreground">
                Ready to save {syncState.lastSyncTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-sync Toggle */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-xs font-medium mb-0.5">Auto-Save</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              {syncState.isSyncEnabled 
                ? 'Changes auto-save every 3 seconds'
                : 'Turn on to automatically save and sync your changes'}
            </div>
          </div>
          <button
            onClick={onToggleSync}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              syncState.isSyncEnabled ? 'bg-primary' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={syncState.isSyncEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                syncState.isSyncEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        
        {!syncState.isSyncEnabled && (
          <div className="flex items-start gap-2 p-2 rounded bg-blue-50 text-blue-700">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              Enable automatic sync to never lose your work. Your changes will be saved to Drive in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onBrowseDrive}>
          Open New File
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onUnlink}>
          Disconnect Auto Save
        </Button>
      </div>

      {/* Error Message */}
      {syncState.errorMessage && (
        <div className="p-2 rounded bg-red-50 border border-red-100 text-red-700 text-[10px] leading-relaxed">
          <strong className="font-medium">Error:</strong> {syncState.errorMessage}
        </div>
      )}
    </div>
  );
}
