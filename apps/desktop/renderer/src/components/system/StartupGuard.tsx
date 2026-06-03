'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function StartupGuard({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function checkSetup() {
      try {
        const res = await window.vyora.bootstrap.status();
        if (res.success && mounted) {
          const isCompleted = res.data;

          if (!isCompleted && pathname !== '/setup') {
            router.replace('/setup');
          } else if (isCompleted && pathname === '/setup') {
            router.replace('/dashboard');
          } else {
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to check bootstrap status', err);
        if (mounted) setIsReady(true);
      }
    }

    checkSetup();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="bg-background text-foreground flex h-screen w-screen items-center justify-center">
        <div className="flex animate-pulse flex-col items-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-4">Initializing Vyora...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
