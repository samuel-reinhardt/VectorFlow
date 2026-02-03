
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';

interface FileNameDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function FileNameDialog({
  isOpen,
  title,
  description,
  defaultValue = '',
  onConfirm,
  onCancel,
  confirmLabel = 'Save',
}: FileNameDialogProps) {
  const [value, setValue] = useState(defaultValue);

  // Update internal state when isOpen or defaultValue changes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || '');
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleConfirm} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filename" className="text-left font-medium">
              Name
            </Label>
            <Input
              id="filename"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
              autoFocus
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useFileNameDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description?: string;
    defaultValue?: string;
    confirmLabel?: string;
  }>({ title: 'Enter Filename' });
  
  const resolveRef = useRef<(value: string | null) => void>(() => {});

  const requestFileName = useCallback((
    title: string = 'Enter Filename', 
    defaultValue?: string, 
    description?: string,
    confirmLabel: string = 'Save'
  ): Promise<string | null> => {
    setConfig({ title, defaultValue, description, confirmLabel });
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback((name: string) => {
    setIsOpen(false);
    // Delay resolution to allow dialog close animation/cleanup to start
    setTimeout(() => {
      resolveRef.current(name);
    }, 100);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      resolveRef.current(null);
    }, 100);
  }, []);

  // Holistic fix: Safety cleanup to ensure pointer-events are restored
  // This handles cases where Radix UI might leave the body locked due to race conditions
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!isOpen) {
      // Small delay to allow Radix to finish its own cleanup
      timeoutId = setTimeout(() => {
        // If body is still locked after close, force unlock
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return { 
    requestFileName, 
    fileNameDialogProps: {
      isOpen,
      title: config.title,
      description: config.description,
      defaultValue: config.defaultValue,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      confirmLabel: config.confirmLabel,
    }
  };
}
