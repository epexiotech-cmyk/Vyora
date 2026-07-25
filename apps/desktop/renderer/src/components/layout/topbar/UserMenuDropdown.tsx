'use client';

import type { UserDto } from '@vyora/types';
import { User, LogOut, Lock, Settings, UserCircle, Shield, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppButton } from '@/components/ui/AppButton';

export function UserMenuDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserDto | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await window.vyora.auth.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await window.vyora.auth.logout();
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const handleLock = async () => {
    try {
      await window.vyora.auth.lock();
      router.push('/lock');
    } catch {
      toast.error('Failed to lock session');
    }
  };

  if (!user) {
    return (
      <AppButton
        variant="ghost"
        size="icon"
        className="bg-secondary/50 h-8 w-8 animate-pulse rounded-full"
      >
        <User className="text-muted-foreground h-4 w-4" />
      </AppButton>
    );
  }

  return (
    <div className="relative">
      <AppButton
        variant="ghost"
        size="icon"
        className="bg-secondary/50 hover:bg-primary/20 h-8 w-8 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-primary text-xs font-semibold">
          {user.fullName?.charAt(0).toUpperCase()}
        </span>
      </AppButton>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="bg-card border-border/50 absolute right-0 z-50 mt-2 w-56 rounded-md border shadow-lg">
            <div className="border-border/50 border-b px-4 py-3">
              <p className="text-sm leading-none font-medium">{user.fullName}</p>
              <p className="text-muted-foreground mt-2 text-xs leading-none">{user.username}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/profile');
                }}
                className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm transition-colors"
              >
                <UserCircle className="mr-2 h-4 w-4" /> My Profile
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm transition-colors"
                >
                  <Shield className="mr-2 h-4 w-4" /> Manage Users
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/settings');
                }}
                className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm transition-colors"
              >
                <Settings className="mr-2 h-4 w-4" /> Preferences
              </button>
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await window.vyora.system.showAbout();
                }}
                className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm transition-colors"
              >
                <Info className="mr-2 h-4 w-4" /> About Vyora
              </button>
            </div>
            <div className="border-border/50 border-t p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLock();
                }}
                className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm text-yellow-600 transition-colors dark:text-yellow-400"
              >
                <Lock className="mr-2 h-4 w-4" /> Lock Session
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="hover:bg-secondary/50 flex w-full items-center rounded px-2 py-2 text-sm text-red-600 transition-colors dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
