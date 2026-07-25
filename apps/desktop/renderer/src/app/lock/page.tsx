'use client';

import type { UserDto } from '@vyora/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

import { FactoryResetDevUI } from '@/components/dev/FactoryResetDevUI';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';

export default function LockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDto | null>(null);

  const [pinArray, setPinArray] = useState<string[]>(Array(4).fill(''));
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadUser() {
      const res = await window.vyora.auth.getCurrentUser();
      if (res.success && res.data) {
        const currentUser = res.data as UserDto;
        setUser(currentUser);
        if (currentUser.pinLength) {
          setPinArray(Array(currentUser.pinLength).fill(''));
        }
      }
    }
    loadUser();
  }, []);

  const pinLength = user?.pinLength || 4;
  const currentPin = pinArray.join('');

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pinArray];
    newPin[index] = value.slice(-1);
    setPinArray(newPin);

    // Auto submit if the last digit is entered
    if (value && index === pinLength - 1) {
      // Small timeout to allow the UI to update the input value before submitting
      setTimeout(() => {
        submitUnlock(newPin.join(''));
      }, 50);
    } else if (value && index < pinLength - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const submitUnlock = async (pinValue: string) => {
    if (pinValue.length !== pinLength) return;
    setLoading(true);

    try {
      const res = await window.vyora.auth.unlock({ pinOrPassword: pinValue });
      if (res.success) {
        toast.success('Session unlocked');
        router.push('/dashboard');
      } else {
        toast.error(res.error || 'Invalid PIN');
        setPinArray(Array(pinLength).fill(''));
        pinRefs.current[0]?.focus();
      }
    } catch {
      toast.error('An error occurred while unlocking');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    submitUnlock(currentPin);
  };

  const handleLogout = async () => {
    await window.vyora.auth.logout();
    router.push('/login');
  };

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      <div className="bg-card border-border/50 w-full max-w-md rounded-lg border p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="bg-primary/20 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-primary text-3xl font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <h2 className="text-xl font-bold">{user?.fullName || 'Locked'}</h2>
          <p className="text-muted-foreground mt-1 text-sm">Enter your PIN to unlock</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="flex justify-center space-x-3">
            {pinArray.map((digit, index) => (
              <AppInput
                key={index}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(index, e)}
                ref={(el) => {
                  pinRefs.current[index] = el;
                }}
                disabled={loading}
                autoFocus={index === 0}
                className="h-14 w-14 text-center text-2xl font-bold"
              />
            ))}
          </div>

          <AppButton
            type="submit"
            className="w-full"
            disabled={loading || currentPin.length !== pinLength}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </AppButton>
        </form>

        <div className="mt-6">
          <button onClick={handleLogout} className="text-primary text-sm hover:underline">
            Not you? Sign out
          </button>
        </div>

        <FactoryResetDevUI />
      </div>
    </div>
  );
}
