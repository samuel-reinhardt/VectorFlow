import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/feedback/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConflictDialogProps {
  isOpen: boolean;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onCancel: () => void;
}

export function ConflictDialog({
  isOpen,
  onKeepLocal,
  onKeepRemote,
  onCancel,
}: ConflictDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <AlertDialogTitle>Sync Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 space-y-3">
            <p>
              Both your local project and the Google Drive file have been modified since the last sync.
            </p>
            <p className="font-medium text-foreground">
              Which version would you like to keep?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>
            Cancel (Disable Sync)
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onKeepRemote}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Keep Drive Version
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onKeepLocal}
            className="bg-primary hover:bg-primary/90"
          >
            Keep Local Version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
