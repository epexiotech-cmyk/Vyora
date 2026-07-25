import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';

export function FactoryResetDevUI() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetChecked, setResetChecked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isPackaged = typeof window !== 'undefined' ? window.vyora.system.isPackaged : true;

  // Debug log to verify evaluating correctly
  console.log(`[FactoryResetDevUI] isPackaged evaluated as: ${isPackaged}`);

  if (isPackaged) return null;

  const handleFactoryReset = async () => {
    if (!window.vyora) return;
    setIsResetting(true);
    try {
      await window.vyora.dev.factoryReset.execute();
      // Service will restart the app automatically
    } catch {
      toast.error('Factory reset failed');
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  return (
    <>
      <div className="border-border mt-8 border-t pt-6 text-center">
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-muted-foreground hover:text-destructive text-xs font-medium transition-colors"
        >
          Development: Factory Reset Application
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background ring-border w-full max-w-md rounded-lg p-6 text-left shadow-2xl ring-1">
            <div className="text-destructive mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-xl font-bold">Factory Reset</h2>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">
              This action will completely wipe all application state, transactions, master data, and
              settings. The application will restart as a fresh installation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Type RESET to confirm</label>
                <AppInput
                  type="text"
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="RESET"
                  disabled={isResetting}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reset-confirm"
                  checked={resetChecked}
                  onChange={(e) => setResetChecked(e.target.checked)}
                  className="text-destructive focus:ring-destructive rounded border-gray-300"
                  disabled={isResetting}
                />
                <label htmlFor="reset-confirm" className="text-sm">
                  I understand all data will be permanently deleted
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <AppButton
                  variant="outline"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetInput('');
                    setResetChecked(false);
                  }}
                  disabled={isResetting}
                >
                  Cancel
                </AppButton>
                <AppButton
                  variant="destructive"
                  onClick={handleFactoryReset}
                  disabled={resetInput !== 'RESET' || !resetChecked || isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Execute Reset'}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
