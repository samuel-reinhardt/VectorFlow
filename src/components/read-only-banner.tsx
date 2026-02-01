import { X, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

interface ReadOnlyBannerProps {
  reason: 'manual' | 'permissions';
  onDisable?: () => void;
  onDismiss?: () => void;
}

export function ReadOnlyBanner({ reason, onDisable, onDismiss }: ReadOnlyBannerProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-amber-900">
          {reason === 'permissions' ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {reason === 'permissions' ? 'View-Only Mode' : 'Read-Only Mode'}
          </span>
        </div>
        <span className="text-xs text-amber-700">
          {reason === 'permissions' 
            ? 'You don\'t have edit permission for this Drive file'
            : 'Editing is disabled. You can view and select items but cannot make changes.'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {reason === 'manual' && onDisable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisable}
            className="h-7 text-xs text-amber-900 hover:bg-amber-100"
          >
            Enable Editing
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-700 hover:text-amber-900 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
