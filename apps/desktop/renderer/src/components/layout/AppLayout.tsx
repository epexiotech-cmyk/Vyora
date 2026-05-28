'use client';

import * as React from 'react';

import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { Topbar } from '@/components/layout/topbar/Topbar';
import { Workspace } from '@/components/layout/workspace/Workspace';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Client-side only rendering to prevent hydration mismatch on layout
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="bg-background h-screen w-screen" />; // Prevent flash
  }

  return (
    <div className="bg-background text-foreground selection:bg-primary/30 flex h-screen w-screen overflow-hidden antialiased">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <ErrorBoundary>
          <Workspace>{children}</Workspace>
        </ErrorBoundary>
      </div>
    </div>
  );
}
