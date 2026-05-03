'use client';

import { useState } from 'react';
import { CloudDownload, CloudUpload, HardDrive, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/overlay/dialog';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Action = 'pull' | 'push' | 'local';

interface Option {
  key: Action;
  icon: React.ElementType;
  iconColor: string;
  border: string;
  hoverBg: string;
  title: string;
  description: string;
  badge?: string;
}

interface ReconnectDialogProps {
  open: boolean;
  /** Fetch the latest version from Drive and replace local state. */
  onPull: () => Promise<void>;
  /** Save the current local state to Drive. */
  onPush: () => Promise<void>;
  /** Disconnect from Drive and continue editing locally. */
  onLocal: () => void;
  /** Display name of the linked Drive file, shown in the description. */
  fileName?: string;
}

// ---------------------------------------------------------------------------
// Options config
// ---------------------------------------------------------------------------

const OPTIONS: Option[] = [
  {
    key: 'pull',
    icon: CloudDownload,
    iconColor: 'text-blue-500',
    border: 'border-blue-500/30 hover:border-blue-500/70',
    hoverBg: 'hover:bg-blue-500/5',
    title: 'Pull from Drive',
    description:
      'Replace your local work with the latest version saved in Google Drive. Your local changes will be lost.',
    badge: 'Recommended if Drive has the definitive version',
  },
  {
    key: 'push',
    icon: CloudUpload,
    iconColor: 'text-emerald-500',
    border: 'border-emerald-500/30 hover:border-emerald-500/70',
    hoverBg: 'hover:bg-emerald-500/5',
    title: 'Push my changes',
    description:
      "Upload your current local edits to Drive. This will overwrite whatever is saved there.",
    badge: 'Recommended if your local version is ahead',
  },
  {
    key: 'local',
    icon: HardDrive,
    iconColor: 'text-muted-foreground',
    border: 'border-border/50 hover:border-border',
    hoverBg: 'hover:bg-muted/40',
    title: 'Work locally',
    description:
      'Disconnect from Drive and keep editing offline. You can re-link the file at any time.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal dialog shown when a user reconnects to Drive (or starts a new session)
 * while a Drive file is linked with edit permissions. Lets the user resolve
 * any potential divergence between their local state and the remote file.
 */
export function ReconnectDialog({
  open,
  onPull,
  onPush,
  onLocal,
  fileName,
}: ReconnectDialogProps) {
  const [loading, setLoading] = useState<Action | null>(null);

  const handle = async (action: Action) => {
    if (loading) return;
    setLoading(action);
    try {
      if (action === 'pull') await onPull();
      else if (action === 'push') await onPush();
      else onLocal();
    } catch {
      // Individual handlers show their own toasts on error.
      // Reset loading so the user can retry.
      setLoading(null);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[440px] gap-5 p-6"
        // Force the user to make an explicit choice — no accidental dismiss.
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-base font-semibold">
            Drive Reconnected
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {fileName ? (
              <>
                You&apos;re back online with{' '}
                <span className="font-medium text-foreground">&ldquo;{fileName}&rdquo;</span>.
                {' '}Your local version and Drive may have diverged while you were offline.
              </>
            ) : (
              "Your Drive connection has been restored. Your local version and the remote file may have diverged. Choose how you'd like to proceed."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          {OPTIONS.map(({ key, icon: Icon, iconColor, border, hoverBg, title, description, badge }) => {
            const isActive = loading === key;
            const isDisabled = loading !== null;

            return (
              <button
                key={key}
                onClick={() => handle(key)}
                disabled={isDisabled}
                className={cn(
                  'group relative flex items-start gap-3.5 rounded-xl border p-4 text-left',
                  'transition-all duration-150 ease-in-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed',
                  border,
                  hoverBg,
                  isDisabled && !isActive && 'opacity-40',
                )}
              >
                {/* Icon */}
                <div className={cn('mt-0.5 shrink-0 transition-transform group-hover:scale-110', iconColor)}>
                  {isActive ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <Icon className="h-[18px] w-[18px]" />
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </div>
                  {badge && (
                    <div className="mt-2 inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {badge}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
