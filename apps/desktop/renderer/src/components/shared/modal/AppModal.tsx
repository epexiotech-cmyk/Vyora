import { Loader2, X } from 'lucide-react';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  hideActions?: boolean;
  className?: string;
}

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  hideActions = false,
  className,
}: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm">
      <div className="bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg leading-none font-semibold tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>

        <div className={cn('py-4', className)}>{children}</div>

        {!hideActions && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AppButton variant="outline" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </AppButton>
            {onConfirm && (
              <AppButton onClick={onConfirm} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmLabel}
              </AppButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
