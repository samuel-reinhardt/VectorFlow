import { Cloud, CloudOff, AlertTriangle, HelpCircle, Check, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlay/popover';
import { SyncPopover } from './sync-popover';
import { SyncState } from '@/hooks/use-cloud-sync';

interface SyncIndicatorProps {
  user: any;
  syncState: SyncState;
  cloudProjectId?: string;
  projectId: string;
  projectName: string;
  onToggleSync: () => void;
  onSaveToCloud: () => void;
  onUnlink: () => void;
}

export function SyncIndicator({
  user,
  syncState,
  cloudProjectId,
  projectId,
  projectName,
  onToggleSync,
  onSaveToCloud,
  onUnlink,
}: SyncIndicatorProps) {
  const getSyncIcon = () => {
    if (!user) {
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (!cloudProjectId) {
      return <CloudOff className="w-4 h-4 text-muted-foreground" />;
    }

    switch (syncState.syncStatus) {
      case 'saving':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'saved':
        return (
          <div className="relative">
            <Cloud className="w-4 h-4 text-green-500" />
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-green-100">
              <Check className="w-2 h-2 text-green-600 stroke-[3]" />
            </div>
          </div>
        );
      case 'error':
        if (syncState.errorType === 'auth') {
          return <LogIn className="w-4 h-4 text-amber-500" />;
        }
        return (
          <div className="relative">
            <Cloud className="w-4 h-4 text-red-500" />
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-red-100">
              <AlertTriangle className="w-2 h-2 text-red-600" />
            </div>
          </div>
        );
      default:
        // Idle or disabled
        return <Cloud className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTooltipText = () => {
    if (!user) return 'Sign in to save to cloud';
    if (!cloudProjectId) return 'Not saved to cloud';
    
    switch (syncState.syncStatus) {
      case 'saving':
        return 'Saving to cloud...';
      case 'saved':
        return syncState.lastSyncTime 
          ? `Saved at ${syncState.lastSyncTime.toLocaleTimeString()}`
          : 'Saved to cloud';
      case 'error':
        if (syncState.errorType === 'auth') {
          return 'Re-authentication required';
        }
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
          cloudProjectId={cloudProjectId}
          projectId={projectId}
          projectName={projectName}
          onToggleSync={onToggleSync}
          onSaveToCloud={onSaveToCloud}
          onUnlink={onUnlink}
        />
      </PopoverContent>
    </Popover>
  );
}
