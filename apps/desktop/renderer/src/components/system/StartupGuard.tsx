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
        console.log(`[TRACE] StartupGuard: Starting checkSetup on pathname: ${pathname}`);
        const statusRes = await window.vyora.bootstrap.status();
        console.log(`[TRACE] StartupGuard: bootstrap.status() result:`, statusRes);

        if (statusRes.success && mounted) {
          const isSetupCompleted = statusRes.data;
          console.log(`[TRACE] StartupGuard: isSetupCompleted = ${isSetupCompleted}`);

          if (!isSetupCompleted) {
            console.log(`[TRACE] StartupGuard: Setup not completed. Redirecting to /setup`);
            if (pathname !== '/setup') router.replace('/setup');
            else setIsReady(true);
            return;
          }

          // Setup is complete, check authentication
          const sessionRes = await window.vyora.auth.verifySession();
          const isAuthenticated = sessionRes.success && sessionRes.data;
          console.log(
            `[TRACE] StartupGuard: verifySession() result:`,
            sessionRes,
            ` isAuthenticated: ${isAuthenticated}`,
          );

          if (!isAuthenticated) {
            console.log(`[TRACE] StartupGuard: Not authenticated. Redirecting to /login`);
            if (pathname !== '/login') router.replace('/login');
            else setIsReady(true);
            return;
          }

          const sessionData = sessionRes.data as { isLocked?: boolean } | undefined;
          console.log(
            `[TRACE] StartupGuard: Lock state (sessionData?.isLocked): ${sessionData?.isLocked}`,
          );
          if (sessionData?.isLocked) {
            console.log(`[TRACE] StartupGuard: Locked. Redirecting to /lock`);
            if (pathname !== '/lock') router.replace('/lock');
            else setIsReady(true);
            return;
          }

          await window.vyora.company.getActive();

          // We let them go to dashboard even without an active company, so they can use the switcher.
          if (pathname === '/setup' || pathname === '/login') {
            console.log(`[TRACE] StartupGuard: Allowed. Redirecting to /dashboard`);
            router.replace('/dashboard');
          } else {
            console.log(`[TRACE] StartupGuard: Allowed. Continuing to ${pathname}`);
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('[TRACE] StartupGuard: Failed to check startup status', err);
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
