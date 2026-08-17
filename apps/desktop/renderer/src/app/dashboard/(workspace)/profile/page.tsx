'use client';

import type { UserDto } from '@vyora/types';
import { Shield, Key, Smartphone } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppInput } from '@/components/ui/AppInput';

export default function ProfilePage() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Form states - PIN
  const [oldPinLength, setOldPinLength] = useState<4 | 6>(4);
  const [oldPinArray, setOldPinArray] = useState<string[]>(Array(4).fill(''));
  const oldPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [newPinLength, setNewPinLength] = useState<4 | 6>(4);
  const [newPinArray, setNewPinArray] = useState<string[]>(Array(4).fill(''));
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  const oldPin = oldPinArray.join('');
  const newPin = newPinArray.join('');

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await window.vyora.auth.getCurrentUser();
        if (res.success && res.data) {
          setUser(res.data as UserDto);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const getPasswordStrength = (password: string) => {
    if (!password) return '';
    let strength = 0;
    if (/(?=.*[a-z])(?=.*[0-9])/i.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[^a-zA-Z0-9])/.test(password)) strength++;
    if (password.length >= 8) strength++;

    if (strength <= 2) return 'Weak';
    if (strength === 3) return 'Medium';
    return 'Strong';
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    const hasAlphaNum = /(?=.*[a-z])(?=.*[0-9])/i.test(newPassword);
    const hasCaps = /(?=.*[A-Z])/.test(newPassword);
    const hasSpecial = /(?=.*[^a-zA-Z0-9])/.test(newPassword);
    if (!hasAlphaNum || !hasCaps || !hasSpecial) {
      toast.error(
        'Password must be alphanumeric with at least 1 uppercase letter and 1 special character',
      );
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await window.vyora.auth.changePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(res.error || 'Failed to change password');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleOldPinLengthChange = (length: 4 | 6) => {
    setOldPinLength(length);
    setOldPinArray(Array(length).fill(''));
  };

  const handleNewPinLengthChange = (length: 4 | 6) => {
    setNewPinLength(length);
    setNewPinArray(Array(length).fill(''));
  };

  const handleOldPinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const arr = [...oldPinArray];
    arr[index] = value.slice(-1);
    setOldPinArray(arr);
    if (value && index < oldPinLength - 1) {
      oldPinRefs.current[index + 1]?.focus();
    }
  };

  const handleOldPinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !oldPinArray[index] && index > 0) {
      oldPinRefs.current[index - 1]?.focus();
    }
  };

  const handleNewPinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const arr = [...newPinArray];
    arr[index] = value.slice(-1);
    setNewPinArray(arr);
    if (value && index < newPinLength - 1) {
      newPinRefs.current[index + 1]?.focus();
    }
  };

  const handleNewPinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !newPinArray[index] && index > 0) {
      newPinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== newPinLength) {
      toast.error(`New PIN must be ${newPinLength} digits`);
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await window.vyora.auth.changePin({
        oldPin: oldPin || undefined,
        newPin,
      });
      if (res.success) {
        toast.success('PIN changed successfully');
        setOldPinArray(Array(oldPinLength).fill(''));
        setNewPinArray(Array(newPinLength).fill(''));
      } else {
        toast.error(res.error || 'Failed to change PIN');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8">Error: User not found.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Basic Info */}
        <div className="space-y-6 md:col-span-1">
          <AppCard className="p-6 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
              <span className="text-primary text-4xl font-semibold">
                {user.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold">{user.fullName}</h2>
            <p className="text-muted-foreground text-sm">{user.username}</p>
            <div className="border-border/50 mt-4 flex justify-center space-x-2 border-t pt-4">
              <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors">
                {user.role}
              </span>
              {user.isActive && (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-500">
                  Active
                </span>
              )}
            </div>
          </AppCard>

          <AppCard className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-semibold">
              <Smartphone className="text-muted-foreground mr-2 h-5 w-5" />
              Active Sessions
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              (Feature coming soon) View and revoke your active sessions across devices.
            </p>
            <AppButton variant="outline" className="w-full" disabled>
              Manage Sessions
            </AppButton>
          </AppCard>
        </div>

        {/* Security Settings */}
        <div className="space-y-6 md:col-span-2">
          <AppCard className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-semibold">
              <Key className="text-muted-foreground mr-2 h-5 w-5" />
              Change Password
            </h3>
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative mt-1">
                  <AppInput
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">New Password</label>
                <div className="relative mt-1">
                  <AppInput
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    {newPassword === confirmNewPassword && newPassword !== '' && (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showNewPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {newPassword && (
                  <div className="mt-1 text-xs font-medium">
                    Strength:{' '}
                    <span
                      className={
                        getPasswordStrength(newPassword) === 'Strong'
                          ? 'text-green-500'
                          : getPasswordStrength(newPassword) === 'Medium'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }
                    >
                      {getPasswordStrength(newPassword)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative mt-1">
                  <AppInput
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    {newPassword === confirmNewPassword && newPassword !== '' && (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmNewPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {confirmNewPassword !== '' && newPassword !== confirmNewPassword && (
                  <div className="mt-1 text-xs font-medium text-red-500">Passwords must match</div>
                )}
              </div>
              <AppButton type="submit" disabled={isSubmittingPassword}>
                {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </AppButton>
            </form>
          </AppCard>

          <AppCard className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-semibold">
              <Shield className="text-muted-foreground mr-2 h-5 w-5" />
              Change Unlock PIN
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Use a quick 4-6 digit PIN to unlock your session instead of typing your full password.
            </p>
            <form className="space-y-6" onSubmit={handlePinSubmit}>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Old PIN</label>
                  <div className="flex space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOldPinLengthChange(4)}
                      className={`rounded px-2 py-1 ${oldPinLength === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      4 Digits
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOldPinLengthChange(6)}
                      className={`rounded px-2 py-1 ${oldPinLength === 6 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      6 Digits
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-start space-x-2">
                  {oldPinArray.map((digit, index) => (
                    <AppInput
                      key={`old-${index}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOldPinChange(index, e.target.value)}
                      onKeyDown={(e) => handleOldPinKeyDown(index, e)}
                      ref={(el) => {
                        oldPinRefs.current[index] = el;
                      }}
                      className="h-12 w-12 text-center text-lg"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">New PIN</label>
                  <div className="flex space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleNewPinLengthChange(4)}
                      className={`rounded px-2 py-1 ${newPinLength === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      4 Digits
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNewPinLengthChange(6)}
                      className={`rounded px-2 py-1 ${newPinLength === 6 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      6 Digits
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-start space-x-2">
                  {newPinArray.map((digit, index) => (
                    <AppInput
                      key={`new-${index}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleNewPinChange(index, e.target.value)}
                      onKeyDown={(e) => handleNewPinKeyDown(index, e)}
                      ref={(el) => {
                        newPinRefs.current[index] = el;
                      }}
                      className="h-12 w-12 text-center text-lg"
                    />
                  ))}
                </div>
              </div>

              <AppButton type="submit" disabled={isSubmittingPin}>
                {isSubmittingPin ? 'Updating...' : 'Update PIN'}
              </AppButton>
            </form>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
