import { Cloud, CloudOff, AlertTriangle, HelpCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlay/popover';
import { SyncPopover } from './sync-popover';
import { SyncState } from '@/hooks/use-drive-sync';

interface SyncIndicatorProps {
  user: any;
  syncState: SyncState;
  googleDriveFileId?: string;
  projectId: string;
  projectName: string;
  onToggleSync: () => void;
  onBrowseDrive: () => void;
  onCreateFile?: () => void;
  onUnlink: () => void;
  onCopyLink: () => void;
}

export function SyncIndicator({
  user,
  syncState,
  googleDriveFileId,
  projectId,
  projectName,
  onToggleSync,
  onBrowseDrive,
  onCreateFile,
  onUnlink,
  onCopyLink,
}: SyncIndicatorProps) {
  const getSyncIcon = () => {
    if (!user) {
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (!googleDriveFileId) {
      return <CloudOff className="w-4 h-4 text-muted-foreground" />;
    }

    switch (syncState.syncStatus) {
      case 'saving':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'saved':
        return (
          <div className="relative">
            <Cloud className="w-4 h-4 text-green-500" />
            <Check className="w-2.5 h-2.5 text-green-500 absolute -bottom-0.5 -right-0.5 bg-background rounded-full" />
          </div>
        );
      case 'error':
        return (
          <div className="relative">
            <Cloud className="w-4 h-4 text-red-500" />
            <AlertTriangle className="w-2.5 h-2.5 text-red-500 absolute -bottom-0.5 -right-0.5 bg-background rounded-full" />
          </div>
        );
      default:
        // Idle or disabled
        return <Cloud className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTooltipText = () => {
    if (!user) return 'Sign in to auto-save to Drive';
    if (!googleDriveFileId) return 'Not auto-saving to Drive';
    
    switch (syncState.syncStatus) {
      case 'saving':
        return 'Saving to Drive...';
      case 'saved':
        return syncState.lastSyncTime 
          ? `Saved to Drive at ${syncState.lastSyncTime.toLocaleTimeString()}`
          : 'Saved to Drive';
      case 'error':
        return syncState.errorMessage || 'Auto-save error';
      default:
        return 'Auto-save enabled';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2"
          title={getTooltipText()}
        >
          {getSyncIcon()}
          <span className="text-xs hidden sm:inline">{getTooltipText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <SyncPopover
          user={user}
          syncState={syncState}
          googleDriveFileId={googleDriveFileId}
          projectId={projectId}
          projectName={projectName}
          onToggleSync={onToggleSync}
          onBrowseDrive={onBrowseDrive}
          onCreateFile={onCreateFile}
          onUnlink={onUnlink}
          onCopyLink={onCopyLink}
        />
      </PopoverContent>
    </Popover>
  );
}
