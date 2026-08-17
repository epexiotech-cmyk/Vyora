'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';

import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { Topbar } from '@/components/layout/topbar/Topbar';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';
import { StartupGuard } from '@/components/system/StartupGuard';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Client-side only rendering to prevent hydration mismatch on layout
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line -- Necessary for Next.js hydration mismatch prevention
    setMounted(true);
  }, []);

  const pathname = usePathname();

  if (!mounted) {
    return <div className="bg-background h-screen w-screen" />; // Prevent flash
  }

  const isSetupRoute = ['/setup', '/login', '/lock'].includes(pathname);

  return (
    <StartupGuard>
      {isSetupRoute ? (
        <div className="bg-background text-foreground flex h-screen w-screen overflow-hidden antialiased">
          {children}
        </div>
      ) : (
        <div className="bg-background text-foreground selection:bg-primary/30 flex h-screen w-screen overflow-hidden antialiased">
          {/* Sidebar Section */}
          <Sidebar />

          {/* Main Content Section */}
          <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      )}
    </StartupGuard>
  );
}
